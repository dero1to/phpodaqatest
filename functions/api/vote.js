export async function onRequest(context) {
  const { env, request } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    const body = await request.json();
    const { questionId, rowIndex } = body;

    if (questionId === undefined || rowIndex === undefined) {
      return new Response(JSON.stringify({
        error: 'Missing questionId or rowIndex'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // A列のIDバリデーション
    if (!questionId || questionId.startsWith('unknown_')) {
      return new Response(JSON.stringify({
        error: 'Invalid question ID'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const SHEET_ID = env.GOOGLE_SHEET_ID;
    const API_KEY = env.GOOGLE_API_KEY;

    if (!SHEET_ID) {
      return new Response(JSON.stringify({
        error: 'Missing configuration'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // APIキーがない場合はクライアントサイドのみで管理
    if (!API_KEY) {
      // クライアントサイドのみで管理する場合、サーバー側では何もしない
      return new Response(JSON.stringify({
        success: true,
        message: 'Vote recorded locally only',
        newCount: null
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Google Sheets APIを使用して更新（APIキーがある場合）
    // まず現在の値を取得
    const actualRowIndex = rowIndex + 2; // ヘッダー行とゼロベースインデックスの調整
    const range = `Sheet1!C${actualRowIndex}`; // C列がGood数と仮定

    const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`;
    const getResponse = await fetch(getUrl);

    if (!getResponse.ok) {
      throw new Error('Failed to fetch current value');
    }

    const currentData = await getResponse.json();
    const currentValue = parseInt(currentData.values?.[0]?.[0] || '0', 10);
    const newValue = currentValue + 1;

    // 値を更新
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?valueInputOption=RAW&key=${API_KEY}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [[newValue.toString()]]
      })
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(errorData.error?.message || 'Failed to update value');
    }

    return new Response(JSON.stringify({
      success: true,
      newCount: newValue
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
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

export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}