addEventListener('fetch', (event) => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    // id 착즙하기
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
        return new Response('Missing id parameter in the URL', { status: 400 });
    }

    // 아카이브 논문 url 준비
    const pdfUrl = `https://arxiv.org/pdf/${id}.pdf`;

    // 일단 사람인척 하기
    const headers = new Headers(request.headers);
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36');

    try {
        // pdf 착즙하기
        const pdfResponse = await fetch(pdfUrl, { headers });

        // 호바밧
        if (pdfResponse.status === 404) {
            return new Response('PDF not found', { status: 404 });
        }


        // 호바밧
        if (!pdfResponse.ok) {
            const errorMessage = `Failed to fetch PDF: ${pdfResponse.statusText}`;
            console.error(errorMessage);
            return new Response(errorMessage, { status: 500 });
        }

        // 착즙한 pdf 유저한테 전송 
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
