import { defineConfig } from "vite";

export default defineConfig({
    server: {
        host: '0.0.0.0',
        port: 3000,
    },
    plugins: [{
       name: 'html-inport',
       transform(code, id){
        if(id.endsWith('.html')){
            return `export default ${JSON.stringify(code)}`;
        }
       }
    }]
})