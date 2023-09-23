addEventListener('fetch', (event) => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    // Parse the URL to extract the requested path
    const url = new URL(request.url);
    const path = url.pathname;

    // Define a routing system
    if (path.startsWith('/download')) {
        // Handle the /download route
        return handleDownloadRequest(request);
    } else if (path === '/ping') {
        // Handle the /ping route to check latency to https://arxiv.org/
        return checkLatencyToArxiv();
    } else if (path === '/') {
        // Handle the root (/) route
        return new Response('cacheXiv: rapid arXiv paper serving system', {
            headers: { 'Content-Type': 'text/plain' },
        });
    } else {
        // Handle unknown routes with a 404 response
        return new Response('Not Found', { status: 404 });
    }
}

async function handleDownloadRequest(request) {
    // Extract the 'id' parameter from the query string
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
        return new Response('Missing id parameter', { status: 400 });
    }

    // Construct the URL to the PDF file
    const pdfUrl = `https://arxiv.org/pdf/${id}.pdf`;

    // Set a custom User-Agent header to make the request appear as if it's from a human
    const headers = new Headers(request.headers);
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36');

    try {
        // Fetch the PDF content from the specified URL and stream it to the user
        const pdfResponse = await fetch(pdfUrl, { headers });

        // Check if the PDF was found
        if (pdfResponse.status === 404) {
            return new Response('PDF not found', { status: 404 });
        }

        // Check for other errors
        if (!pdfResponse.ok) {
            const errorMessage = `Failed to fetch PDF: ${pdfResponse.statusText}`;
            console.error(errorMessage);
            return new Response(errorMessage, { status: 500 });
        }

        // Stream the PDF content to the user
        return new Response(pdfResponse.body, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${id}.pdf"`,
            },
        });
    } catch (error) {
        const errorMessage = `An error occurred while fetching the PDF: ${error.message}`;
        console.error(errorMessage);
        return new Response(errorMessage, {
            status: 500,
        });
    }
}

async function checkLatencyToArxiv() {
    // Define the URL to test latency to (https://arxiv.org/)
    const arxivUrl = 'https://arxiv.org/';

    // Set a custom User-Agent header for the request
    const headers = new Headers();
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36');

    // Measure the time it takes to send a request and receive a response
    const start = Date.now();

    try {
        // Send a request to arxiv.org with the custom User-Agent header
        await fetch(arxivUrl, { headers });

        const end = Date.now();

        // Calculate the latency in milliseconds
        const latencyMs = end - start;

        // Return the latency as a response
        return new Response(`Latency to https://arxiv.org/: ${latencyMs} ms`, {
            headers: { 'Content-Type': 'text/plain' },
        });
    } catch (error) {
        return new Response(`Error: ${error.message}`, { status: 500 });
    }
}