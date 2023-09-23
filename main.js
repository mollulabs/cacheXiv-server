addEventListener('fetch', (event) => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith('/download')) {
        return handleDownloadRequest(request);
    } else if (path === '/ping') {
        return checkLatencyToArxiv();
    } else if (path.startsWith('/viewer')) {
        return handleViewerRequest(request);
    } else if (path === '/') {
        return new Response('cacheXiv: rapid arXiv paper serving system', {
            headers: { 'Content-Type': 'text/plain' },
        });
    } else {
        return new Response('Not Found', { status: 404 });
    }
}

async function handleDownloadRequest(request) {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
        return new Response('Missing id parameter', { status: 400 });
    }

    const pdfUrl = `https://arxiv.org/pdf/${id}.pdf`;

    const headers = new Headers(request.headers);
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36');

    try {
        const pdfResponse = await fetch(pdfUrl, { headers });

        if (pdfResponse.status === 404) {
            return new Response('PDF not found', { status: 404 });
        }

        if (!pdfResponse.ok) {
            const errorMessage = `Failed to fetch PDF: ${pdfResponse.statusText}`;
            console.error(errorMessage);
            return new Response(errorMessage, { status: 500 });
        }

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

async function handleViewerRequest(request) {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
        return new Response('Missing id parameter', { status: 400 });
    }

    const iframeUrl = `https://docs.google.com/gview?url=https://cachexiv.quk.one/download?id=${id}&embedded=true`;
    const iframeHtml = `
      <html>
          <head>
              <title>cacheXiv </title>
          </head>
          <body>
              <iframe src="${iframeUrl}" width="100%" height="100%" frameborder="0"></iframe>
          </body>
      </html>
  `;
    return new Response(iframeHtml, {
        headers: { 'Content-Type': 'text/html' },
    });
}

async function checkLatencyToArxiv() {
    const arxivUrl = 'https://arxiv.org/';

    const headers = new Headers();
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36');

    const start = Date.now();

    try {
        await fetch(arxivUrl, { headers });
        const end = Date.now();
        const latencyMs = end - start;
        return new Response(`Latency to https://arxiv.org/: ${latencyMs} ms`, {
            headers: { 'Content-Type': 'text/plain' },
        });
    } catch (error) {
        return new Response(`Error: ${error.message}`, { status: 500 });
    }
}
