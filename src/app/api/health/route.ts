/** Liveness for load balancers and the Docker healthcheck (does not call the shop). */
export function GET() {
  return Response.json({ status: 'ok' }, { headers: { 'cache-control': 'no-store' } });
}
