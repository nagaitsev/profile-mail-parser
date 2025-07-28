addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Respond to the request
 * @param {Request} request
 */
async function handleRequest(request) {
  // Set CORS headers
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*', // Or your specific domain for better security
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  // Ensure it's a POST request
  if (request.method !== 'POST') {
    return new Response('Expected POST', { status: 405, headers });
  }

  try {
    const { text } = await request.json();

    if (!text) {
      return new Response('Missing "text" in request body', { status: 400, headers });
    }

    // Construct the request to Artlebedev's Typograf service
    const typografRequestUrl = 'http://typograf.artlebedev.ru/webservices/typograf.asmx/ProcessText';
    const typografRequestBody = `text=${encodeURIComponent(text)}&entityType=1&useBr=0&useP=0&maxNobr=3`;

    const typografResponse = await fetch(typografRequestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: typografRequestBody,
    });

    if (!typografResponse.ok) {
      throw new Error(`Typograf service responded with status: ${typografResponse.status}`);
    }

    const responseXml = await typografResponse.text();

    // Super simple XML parsing to extract the processed text
    const match = /<string xmlns="http:\/\/www.artlebedev.ru\/">(.*?)<\/string>/.exec(responseXml) || /<string xmlns="http:\/\/www.artlebedev.ru\/">(.*?)<\/string>/.exec(responseXml);
    const processedText = match ? match[1].replace(/</g, '<').replace(/>/g, '>').replace(/&/g, '&') : text;


    // Send the processed text back to the client
    return new Response(JSON.stringify({ processedText }), {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    return new Response(error.message, { status: 500, headers });
  }
}
