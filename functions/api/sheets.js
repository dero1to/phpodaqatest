export async function onRequest(context) {
  const { env, request } = context;
  const urlParams = new URL(request.url).searchParams;

  const SHEET_ID = env.GOOGLE_SHEET_ID || urlParams.get('sheet_id');
  const API_KEY = env.GOOGLE_API_KEY;
  const RANGE = env.SHEET_RANGE || urlParams.get('range') || 'Sheet1!A:Z';
  const USE_CSV = urlParams.get('csv') === 'true' || (!API_KEY && !urlParams.get('csv'));

  if (!SHEET_ID) {
    return new Response(JSON.stringify({
      error: 'Missing Sheet ID'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    let data;

    if (USE_CSV) {
      const gid = urlParams.get('gid') || '0';
      const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;

      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch CSV data');
      }

      const csvText = await response.text();
      data = parseCSV(csvText);
    } else {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to fetch data');
      }

      const values = result.values || [];

      if (values.length === 0) {
        return new Response(JSON.stringify({
          data: [],
          message: 'No data found'
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      const headers = values[0];
      const rows = values.slice(1);

      data = rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });
    }

    // B列（2番目のカラム）に値があるレコードだけをフィルタリング
    const filteredData = data.filter(row => {
      const keys = Object.keys(row);
      if (keys.length >= 2) {
        const secondColumn = row[keys[1]];
        return secondColumn && secondColumn.toString().trim() !== '';
      }
      return false;
    });

    return new Response(JSON.stringify({
      data: filteredData,
      total: filteredData.length,
      totalOriginal: data.length,
      method: USE_CSV ? 'csv' : 'api'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]);
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      data.push(obj);
    }
  }

  return data;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}