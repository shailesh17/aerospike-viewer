# Aerospike Viewer with AI Schema Analysis

This is a full-stack web application designed to help you explore your Aerospike databases. It provides a clean, modern interface to connect to a cluster, browse namespaces and sets, and view records. It also includes a unique AI-powered feature that automatically generates schema summaries for your data sets using the Google Gemini API.

## Features

- **Connect to Aerospike**: Simple interface to connect to any running Aerospike cluster.
- **Namespace & Set Explorer**: A tree-view to easily navigate through your database namespaces and the sets within them.
- **Record Viewer**: Displays records from a selected set in a clear, tabular format with a built-in JSON viewer for complex bins.
- **AI Schema Summary**: When you view a set, a sample of records is sent to a backend service that uses the Gemini API to generate a human-readable summary of the data's schema. This helps you quickly understand the structure and purpose of your data.
- **Responsive Design**: Built with Tailwind CSS for a modern, responsive user experience.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: Aerospike
- **AI**: Google Gemini

## Getting Started

Follow these instructions to get the project running on your local machine for development and testing.

### Prerequisites

- **Node.js**: Make sure you have a recent version of Node.js installed (v18.x or higher is recommended).
- **Aerospike Database**: You need a running Aerospike database instance that the application can connect to. You can use the [Aerospike Docker container](https://hub.docker.com/r/aerospike/aerospike-server) for a quick setup.
- **Gemini API Key**: To enable the AI schema summary feature, you need a Google Gemini API key. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/aerospike-viewer.git
    cd aerospike-viewer
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root of the project directory and add your Gemini API key:

    ```env
    # .env
    API_KEY=your_gemini_api_key_here
    ```

    *Note: The AI features will be disabled if the `API_KEY` is not provided, but the rest of the application will still be functional.*

### Running the Application

This project has a separate frontend and backend, and you'll need to run both for the application to work correctly.

1.  **Run the backend server:**

    Open a terminal and run the following command to start the Node.js server. It will watch for changes and automatically restart.

    ```bash
    npm run dev:server
    ```
    The server will typically start on `http://localhost:8080`.

2.  **Run the frontend development server:**

    Open a second terminal and run the following command to start the Vite development server for the React frontend.

    ```bash
    npm run dev:frontend
    ```
    The frontend will be available at `http://localhost:5173` (or another port if 5173 is busy). Open this URL in your browser to use the application.

## Building for Production

To create a production build, you can run the build script:

```bash
npm run build
```

This command will:
1.  Build the React frontend into the `dist` directory.
2.  Compile the TypeScript backend server into `dist/server`.

After the build is complete, you can start the application in production mode with:

```bash
npm run start
```

This will run the optimized server from the `dist` folder.
