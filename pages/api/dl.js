export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { data, name } = req.body;
  if (!data || !name) return res.status(400).end();
  try {
    const buf = Buffer.from(data, 'base64');
    const safe = name.replace(/[^a-zA-Z0-9._-]/g, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="' + safe + '"');
    res.setHeader('Content-Length', buf.length);
    res.setHeader('Cache-Control', 'no-store');
    res.send(buf);
  } catch {
    res.status(500).end();
  }
}
