import webpush from 'web-push';

const publicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
const privateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

webpush.setVapidDetails(
  'mailto:coordinator@gestorpickers.com',
  publicKey,
  privateKey
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Content-Type': 'application/json',
};

Deno.serve(async (req) => {
  // Manejar preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const { subscription, title, body, url } = await req.json();

    if (!subscription || !subscription.endpoint) {
      return new Response(
        JSON.stringify({ error: 'Invalid subscription' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const payload = JSON.stringify({
      title: title || 'Gestor de Pickers',
      body: body || 'Tienes una nueva notificación',
      url: url || '/picker',
    });

    await webpush.sendNotification(subscription, payload);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error sending push notification:', error);

    if (error.statusCode === 410) {
      return new Response(
        JSON.stringify({ error: 'Subscription expired', expired: true }),
        { status: 410, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Failed to send notification' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
