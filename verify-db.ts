import { supabase } from './src/db/supabase.js';

async function verifyConnection() {
  console.log('Verificando conexão com o Supabase...');
  console.log('URL configurada:', process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 15) + '...' : 'Não');
  console.log('Key configurada:', (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY) ? (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY).substring(0, 10) + '...' : 'Não');
  
  try {
    const url = `${process.env.SUPABASE_URL}/rest/v1/users?select=*&limit=1`;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    console.log('Fazendo requisição direta para:', url);
    const response = await fetch(url, {
      headers: {
        'apikey': key as string,
        'Authorization': `Bearer ${key}`
      }
    });
    
    console.log('Status da resposta:', response.status);
    const text = await response.text();
    console.log('Corpo da resposta:', text);
    
    if (!response.ok) {
      process.exit(1);
    }
    
    console.log('Conexão bem-sucedida! O banco de dados está respondendo corretamente.');
  } catch (err) {
    console.error('Erro inesperado:', err);
    process.exit(1);
  }
}

verifyConnection();
