import * as dotenv from 'dotenv';
dotenv.config(); // Must be called before other imports that rely on environment variables

// FIX: Changed import to use default express import to resolve type conflicts with other libraries.
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import Aerospike from 'aerospike';
import path from 'path';
import { GoogleGenAI } from "@google/genai";
import { randomUUID } from 'crypto';

const app = express();
const PORT = 8080;

app.use(cors());
app.use(bodyParser.json());

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

let client: Aerospike.Client | null = null;

// --- Aerospike Connection API ---

// FIX: Explicitly use express.Request and express.Response types.
app.post('/api/connect', async (req: express.Request, res: express.Response) => {
    if (client && client.isConnected()) {
        return res.status(200).json({ message: 'Already connected' });
    }
    
    const { host, port, useAlternate } = req.body;
    if (!host || !port) {
        return res.status(400).json({ message: 'Host and port are required' });
    }

    try {
        const config: Aerospike.Config = {
            hosts: [{ addr: host, port }],
            log: { level: Aerospike.log.INFO },
            modlua: {},
            policies: {},
            port,
            useAlternateAccessAddress: useAlternate,
            setDefaultPolicies: function (policies?: Aerospike.ConfigPolicies): void {
                throw new Error('Function not implemented.');
            }
        };

        client = await Aerospike.connect(config);
        console.log('Successfully connected to Aerospike cluster.');
        res.status(200).json({ message: 'Connection successful' });
    } catch (error: any) {
        console.error('Aerospike connection error:', error);
        client = null;
        res.status(500).json({ message: error.message || 'Failed to connect to Aerospike' });
    }
});

// FIX: Explicitly use express.Request and express.Response types.
app.post('/api/disconnect', async (req: express.Request, res: express.Response) => {
    if (client && client.isConnected()) {
        client.close();
        client = null;
        console.log('Disconnected from Aerospike.');
    }
    res.status(200).json({ message: 'Disconnected' });
});

// --- Data Fetching API ---

// FIX: Explicitly use express.Response type.
const checkConnection = (): Aerospike.Client => {
    if (!client || !client.isConnected()) {
        throw new Error('Not connected to Aerospike');
    }
    return client;
};

// --- Server Stats API ---
app.get('/api/stats', async (req: express.Request, res: express.Response) => {
    try {
        const client = checkConnection();

        // Fetch multiple info commands concurrently
        const [buildInfo, statsInfo, nsInfo] = await Promise.all([
            client.infoAny('build'),
            client.infoAny('statistics'),
            client.infoAny('namespaces')
        ]);

        // Parse version from build info
        const version = buildInfo;

        // Parse uptime from statistics
        const uptimeMatch = statsInfo.match(/uptime=(\d+)/);
        const uptime = uptimeMatch ? parseInt(uptimeMatch[1], 10) : 0;

        // Parse and sum objects from namespace info
        const totalObjects = nsInfo.split(';').reduce((sum, ns) => {
            const objectsMatch = ns.match(/objects=(\d+)/);
            return sum + (objectsMatch ? parseInt(objectsMatch[1], 10) : 0);
        }, 0);

        res.json({ version, uptime, totalObjects });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// FIX: Explicitly use express.Request and express.Response types.
app.get('/api/namespaces', async (req: express.Request, res: express.Response) => {
    try {
        const client = checkConnection();
        // FIX: Use infoAny to query a random node, as info() requires a specific host.
        const info: string = await client.infoAny('namespaces');

        console.log('--- Raw namespaces info from Aerospike:');
        console.log(info);
        console.log('---');
        const namespaces = info.split(';').map(ns => {
            const parts = ns.split('\t');
            return parts.length > 1 ? parts[1].trim() : null;
        }).filter((s): s is string => s !== null && s !== 'namespaces');
        console.log('--- Parsed namespaces:');
        console.log(namespaces);
        console.log('---');
        res.json({ namespaces, raw: info });
    } catch (error: any) {
        if (error.message === 'Not connected to Aerospike') {
            return res.status(400).json({ message: error.message });
        }
        console.error('--- Error fetching namespaces:');
        console.error(error);
        console.error('---');
        res.status(500).json({ message: error.message });
    }
});

// FIX: Explicitly use express.Request and express.Response types.
app.get('/api/namespaces/:namespace/sets', async (req: express.Request, res: express.Response) => {
    const { namespace } = req.params;
    try {
        const client = checkConnection();
        // FIX: Use infoAny to query a random node.
        const info: string = await client.infoAny(`sets/${namespace}`);
        console.log(`--- Raw sets info for namespace "${namespace}":`);
        console.log(info);
        console.log('---');
        // The info string format is ns_name=test:set_name=users:n_objects=1...;...
        const sets = info.split(';').map(setInfoString => {
            if (!setInfoString.includes('set=')) return null;

            const setDetails: { [key: string]: string | number } = {};
            setInfoString.split(':').forEach(part => {
                const [key, ...valueParts] = part.split('=');
                const value = valueParts.join('=');
                if (key && value) {
                    if (key === 'objects' || key === 'data_used_bytes') {
                        setDetails[key] = parseInt(value, 10);
                    } else if (key === 'set') {
                        setDetails['name'] = value;
                    }
                }
            });
            return setDetails.name && !String(setDetails.name).startsWith('<') ? setDetails : null;
        }).filter((s): s is { [key: string]: string | number } => s !== null);
        console.log('--- Parsed sets:');
        console.log(sets);
        console.log('---');
        res.json({ sets });
    } catch (error: any) {
        if (error.message === 'Not connected to Aerospike') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
});

// FIX: Explicitly use express.Request and express.Response types.
app.get('/api/namespaces/:namespace/sets/:set/records', async (req: express.Request, res: express.Response) => {
    const { namespace, set } = req.params
    const { nextToken } = req.query;
    try {
        const client = checkConnection();

        const scanOptions: Aerospike.ScanOptions = { paginate: true };
        if (nextToken && typeof nextToken === 'string') {
            scanOptions.scanState = JSON.parse(Buffer.from(nextToken, 'base64').toString());
        }

        const scan = client.scan(namespace, set, scanOptions);
        const policy: Aerospike.ScanPolicy = { maxRecords: 100 };

        const stream = scan.foreach(policy);
        const records: any[] = [];
        
        stream.on('data', (record) => {
            records.push({
                key: record.key.key || record.key.digest,
                bins: record.bins,
            });
        });

        stream.on('error', (error) => {
            console.error('Scan error:', error);
            // AEROSPIKE_QUERY_END is returned when pagination is done.
            if (error.code === Aerospike.status.AEROSPIKE_QUERY_END) {
                return res.json({ records, nextToken: null });
            } else if (!res.headersSent) {
                res.status(500).json({ message: 'Error scanning records' });
            }
        });

        stream.on('end', (scanState) => {
            if (!res.headersSent) {
                const next = scanState ? Buffer.from(JSON.stringify(scanState)).toString('base64') : null;
                res.json({ records, nextToken: next });
            }
        });

    } catch (error: any) {
        if (error.message === 'Not connected to Aerospike') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
});


// --- Gemini Service API ---

const API_KEY = process.env.API_KEY;
let ai: GoogleGenAI | null = null;
if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.warn("Gemini API key not found in process.env.API_KEY. AI features will be disabled.");
}

// FIX: Explicitly use express.Request and express.Response types.
app.post('/api/schema-summary', async (req: express.Request, res: express.Response) => {
    if (!ai) {
        return res.status(500).json({ message: "AI service is not configured on the server. Ensure API_KEY is in your .env file." });
    }

    const { records, setName } = req.body;
    
    const sample = records.map((r: any) => r.bins);
    const prompt = `
        Analyze the following sample of JSON objects, which represent records from an Aerospike database set named "${setName}".
        Based on this sample, provide a brief, user-friendly summary of the data schema in Markdown format.
        Describe the likely purpose of the most important bins (fields) and mention their data types.
        Do not just list the fields; explain what the data represents as a whole.

        Sample Records:
        ${JSON.stringify(sample, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        res.json({ summary: response.text });
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        res.status(500).json({ message: "An error occurred while generating the AI-powered schema summary." });
    }
});


const projectRoot = __dirname; 
const distDir = path.join(projectRoot, 'dist');
const uuid = randomUUID();

// Serve the main index.html for any other request
app.get('/', (req, res) => {
    res.sendFile(path.join(projectRoot, 'index.html'));
});
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=UTF-8');
  res.send(`{"workspace": { "root": "${projectRoot}", "uuid": "${uuid}" } }`);
});

app.get('/*', (req, res) => {
    res.sendFile(path.join(projectRoot, req.path));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Serving frontend from: ${projectRoot}`);
});
