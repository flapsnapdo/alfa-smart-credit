import openapiTS from 'openapi-typescript';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateTypes() {
  try {
    const openapiPath = join(__dirname, '../docs/openapi.yaml');
    const outputPath = join(__dirname, '../apps/web/src/types/api.ts');
    
    // Создаём папку types, если её нет
    mkdirSync(join(__dirname, '../apps/web/src/types'), { recursive: true });
    
    console.log('📄 Генерация типов из OpenAPI...');
    
    const ast = await openapiTS(openapiPath);
    const types = `// Auto-generated types from OpenAPI
// Do not edit manually
// Generated at: ${new Date().toISOString()}

${ast.toString()}

export type Components = components;
export type Schemas = components['schemas'];
export type Paths = paths;
`;
    
    writeFileSync(outputPath, types, 'utf8');
    
    console.log('✅ Types generated successfully!');
    console.log(`📁 File saved to: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error generating types:', error);
    process.exit(1);
  }
}

generateTypes();