addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Respond to the request
 * @param {Request} request
 */
async function handleRequest(request) {
  console.log('Received request:', request.method, request.url);

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': 'https://nagaitsev.github.io',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
      },
    });
  }

  // Ensure it's a POST request
  if (request.method !== 'POST') {
    return new Response('Expected POST', { status: 405, headers });
  }

  try {
    const requestBody = await request.json();
    const text = requestBody.text;
    console.log('Request body text:', text);

    if (!text) {
      console.error('Missing "text" in request body');
      return new Response('Missing "text" in request body', { status: 400, headers });
    }

    // Construct the SOAP XML request body
    const typografRequestBody = 
        '<?xml version="1.0" encoding="UTF-8"?>' + 
        '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'xmlns:xsd="http://www.w3.org/2001/XMLSchema" ' + 
        'xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' + 
            '<soap:Body>' +
                '<ProcessText xmlns="http://typograf.artlebedev.ru/webservices/">' + 
                    '<text>' + text + '</text>' + 
                '</ProcessText>' +
            '</soap:Body>' +
        '</soap:Envelope>';

    // Construct the request to Artlebedev's Typograf service
    const typografRequestUrl = 'http://typograf.artlebedev.ru/webservices/typograf.asmx'; // Endpoint for SOAP

    console.log('Sending request to Typograf:', typografRequestUrl, 'with body:', typografRequestBody);
    const typografResponse = await fetch(typografRequestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8', // Correct Content-Type for SOAP
        'SOAPAction': 'http://typograf.artlebedev.ru/webservices/ProcessText' // SOAPAction header is often required
      },
      body: typografRequestBody,
    });

    console.log('Typograf response status:', typografResponse.status);
    if (!typografResponse.ok) {
      const errorText = await typografResponse.text();
      console.error('Typograf service error response:', errorText);
      throw new Error(`Typograf service responded with status: ${typografResponse.status}. Details: ${errorText.substring(0, 200)}`);
    }

    const responseXml = await typografResponse.text();
    console.log('Raw Typograf response XML:', responseXml.substring(0, 500)); // Log raw XML for debugging

    // Parse the processed text using the provided regex
    const re = /<ProcessTextResult>\s*((.|\n)*?)\s*<\/ProcessTextResult>/m;
    const match = re.exec(responseXml);
    let processedText = match ? match[1] : text; // Use the captured group

    // Decode HTML entities - THIS IS THE CORRECTED PART
    processedText = processedText.replace(/&gt;/g, '>');
    processedText = processedText.replace(/&lt;/g, '<');
    processedText = processedText.replace(/&amp;/g, '&');

    console.log('Processed text from Typograf:', processedText.substring(0, 200)); // Log first 200 chars

    // Send the processed text back to the client
    const response = new Response(JSON.stringify({ processedText }), {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Explicitly set CORS headers on the response object
    response.headers.set('Access-Control-Allow-Origin', 'https://nagaitsev.github.io');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;

  } catch (error) {
    console.error('Error in Worker:', error.message);
    const errorResponse = new Response(error.message, { status: 500 });
    errorResponse.headers.set('Access-Control-Allow-Origin', 'https://nagaitsev.github.io'); // Ensure CORS on error too
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return errorResponse;
  }
}