const testQuestions = require('./test_5_questions.cjs');

async function testServer() {
  const results = [];
  const startTime = Date.now();
  
  console.log('🚀 Iniciando teste com 5 perguntas diferentes...\n');
  
  for (let i = 0; i < testQuestions.length; i++) {
    const question = testQuestions[i];
    const questionStartTime = Date.now();
    
    console.log(`📝 Pergunta ${i + 1}/5: "${question}"`);
    
    try {
      const response = await fetch('http://localhost:3001/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: i + 1,
          method: 'tools/call',
          params: {
            name: 'ask_kommo',
            arguments: { question }
          }
        })
      });
      
      const responseText = await response.text();
      const questionEndTime = Date.now();
      const responseTime = (questionEndTime - questionStartTime) / 1000;
      
      // Parse Server-Sent Events format
      let data;
      if (responseText.startsWith('data: ')) {
        const jsonPart = responseText.substring(6); // Remove 'data: ' prefix
        data = JSON.parse(jsonPart);
      } else {
        data = JSON.parse(responseText);
      }
      
      if (data.result && data.result.content && data.result.content[0]) {
        const responseTextContent = data.result.content[0].text;
        const parsedResponse = JSON.parse(responseTextContent);
        
        const result = {
          question: question,
          success: true,
          responseTime: responseTime,
          metadata: parsedResponse.agent_response?.metadata || {},
          cacheHit: parsedResponse.agent_response?.metadata?.cache_hit || false,
          temporalFilter: parsedResponse.agent_response?.metadata?.temporal_filter,
          categoryFilter: parsedResponse.agent_response?.metadata?.category_filter,
          totalLeads: parsedResponse.agent_response?.metadata?.total_leads_analyzed,
          performanceMetrics: parsedResponse.agent_response?.metadata?.performance_metrics
        };
        
        results.push(result);
        
        console.log(`✅ Sucesso em ${responseTime.toFixed(2)}s`);
        console.log(`   📊 Leads analisados: ${result.totalLeads}`);
        console.log(`   ⏰ Filtro temporal: ${result.temporalFilter || 'Nenhum'}`);
        console.log(`   🏷️ Filtro categoria: ${result.categoryFilter || 'Nenhum'}`);
        console.log(`   💾 Cache hit: ${result.cacheHit ? 'Sim' : 'Não'}`);
        if (result.performanceMetrics) {
          console.log(`   📈 Taxa cache: ${result.performanceMetrics.cache_hit_rate}`);
          console.log(`   ⚡ Tempo médio: ${result.performanceMetrics.average_response_time}`);
        }
        console.log('');
      } else {
        console.log(`❌ Erro na resposta: ${JSON.stringify(data)}`);
        results.push({
          question: question,
          success: false,
          responseTime: responseTime,
          error: data.error || 'Resposta inválida'
        });
      }
    } catch (error) {
      const questionEndTime = Date.now();
      const responseTime = (questionEndTime - questionStartTime) / 1000;
      
      console.log(`❌ Erro: ${error.message}`);
      results.push({
        question: question,
        success: false,
        responseTime: responseTime,
        error: error.message
      });
    }
    
    // Pequena pausa entre perguntas
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  const totalTime = (Date.now() - startTime) / 1000;
  const successfulTests = results.filter(r => r.success).length;
  const failedTests = results.filter(r => !r.success).length;
  
  console.log('📊 RESUMO DO TESTE:');
  console.log(`⏱️ Tempo total: ${totalTime.toFixed(2)}s`);
  console.log(`✅ Sucessos: ${successfulTests}/5`);
  console.log(`❌ Falhas: ${failedTests}/5`);
  console.log(`📈 Taxa de sucesso: ${(successfulTests/5*100).toFixed(1)}%`);
  
  if (successfulTests > 0) {
    const avgResponseTime = results.filter(r => r.success).reduce((sum, r) => sum + r.responseTime, 0) / successfulTests;
    console.log(`⚡ Tempo médio de resposta: ${avgResponseTime.toFixed(2)}s`);
    
    const cacheHits = results.filter(r => r.success && r.cacheHit).length;
    console.log(`💾 Cache hits: ${cacheHits}/${successfulTests} (${(cacheHits/successfulTests*100).toFixed(1)}%)`);
    
    const temporalDetections = results.filter(r => r.success && r.temporalFilter).length;
    console.log(`📅 Detecções temporais: ${temporalDetections}/${successfulTests} (${(temporalDetections/successfulTests*100).toFixed(1)}%)`);
    
    const categoryDetections = results.filter(r => r.success && r.categoryFilter).length;
    console.log(`🏷️ Detecções de categoria: ${categoryDetections}/${successfulTests} (${(categoryDetections/successfulTests*100).toFixed(1)}%)`);
  }
  
  // Salvar resultados detalhados
  const fs = require('fs');
  fs.writeFileSync('test_5_results.json', JSON.stringify({
    summary: {
      total: 5,
      successful: successfulTests,
      failed: failedTests,
      duration: totalTime,
      avgTimePerQuestion: successfulTests > 0 ? results.filter(r => r.success).reduce((sum, r) => sum + r.responseTime, 0) / successfulTests : 0
    },
    results: results
  }, null, 2));
  
  console.log('\n💾 Resultados salvos em test_5_results.json');
}

testServer().catch(console.error);
