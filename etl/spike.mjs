const sheetId = '1SWqLJ6tGmYHzqGaa4RZs54iw7C1uLcTU_rLTRHTOzaA';
const gid = '239063037';
const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(30_000) });
const type = response.headers.get('content-type') ?? '';
if (!response.ok || type.includes('text/html')) throw new Error(`Invalid sheet response: ${response.status} (${type})`);
console.log((await response.text()).split(/\r?\n/).slice(0, 3).join('\n'));
