const questions = require('./test_questions.cjs');

async function testQuestion(question, index) {
  try {
    const response = await fetch('http://localhost:3001/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: index + 1,
        method: "tools/call",
        params: {
          name: "ask_kommo",
          arguments: {
            question: question
          }
        }
      })
    });

    const data = await response.text();
    const lines = data.split('\n');
    const resultLine = lines.find(line => line.startsWith('data: '));
    
    if (resultLine) {
      const jsonData = JSON.parse(resultLine.substring(6));
      return {
        question,
        success: true,
        response: jsonData.result?.content?.[0]?.text || 'No content',
        metadata: JSON.parse(jsonData.result?.content?.[0]?.text || '{}').metadata || {}
      };
    } else {
      return {
        question,
        success: false,
        error: 'No data line found',
        response: data
      };
    }
  } catch (error) {
    return {
      question,
      success: false,
      error: error.message,
      response: null
    };
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes com 50 perguntas...\n');
  
  const results = [];
  const startTime = Date.now();
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    console.log(`📝 Teste ${i + 1}/50: ${question}`);
    
    const result = await testQuestion(question, i);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ Sucesso`);
    } else {
      console.log(`❌ Erro: ${result.error}`);
    }
    
    // Pequena pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log('\n📊 ANÁLISE DOS RESULTADOS:');
  console.log('='.repeat(50));
  
  // Estatísticas gerais
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Sucessos: ${successful}/${questions.length} (${(successful/questions.length*100).toFixed(1)}%)`);
  console.log(`❌ Falhas: ${failed}/${questions.length} (${(failed/questions.length*100).toFixed(1)}%)`);
  console.log(`⏱️ Tempo total: ${duration.toFixed(1)}s`);
  console.log(`⚡ Tempo médio por pergunta: ${(duration/questions.length).toFixed(1)}s`);
  
  // Análise de padrões
  console.log('\n🔍 ANÁLISE DE PADRÕES:');
  console.log('='.repeat(50));
  
  const successfulResults = results.filter(r => r.success);
  
  // Análise de temporal_filter
  const temporalFilters = {};
  successfulResults.forEach(r => {
    const filter = r.metadata.temporal_filter;
    if (filter) {
      temporalFilters[filter] = (temporalFilters[filter] || 0) + 1;
    }
  });
  
  console.log('\n📅 Filtros Temporais Detectados:');
  Object.entries(temporalFilters).forEach(([filter, count]) => {
    console.log(`  ${filter}: ${count} vezes`);
  });
  
  // Análise de category_filter
  const categoryFilters = {};
  successfulResults.forEach(r => {
    const filter = r.metadata.category_filter;
    if (filter) {
      categoryFilters[filter] = (categoryFilters[filter] || 0) + 1;
    }
  });
  
  console.log('\n🏷️ Filtros de Categoria Detectados:');
  Object.entries(categoryFilters).forEach(([filter, count]) => {
    console.log(`  ${filter}: ${count} vezes`);
  });
  
  // Análise de month_filter
  const monthFilters = {};
  successfulResults.forEach(r => {
    const filter = r.metadata.month_filter;
    if (filter !== null && filter !== undefined) {
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                         'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const monthName = monthNames[filter] || `Mês ${filter}`;
      monthFilters[monthName] = (monthFilters[monthName] || 0) + 1;
    }
  });
  
  console.log('\n📆 Filtros de Mês Detectados:');
  Object.entries(monthFilters).forEach(([filter, count]) => {
    console.log(`  ${filter}: ${count} vezes`);
  });
  
  // Análise de leads analisados
  const leadCounts = successfulResults.map(r => r.metadata.total_leads_analyzed || 0);
  const avgLeads = leadCounts.reduce((a, b) => a + b, 0) / leadCounts.length;
  const maxLeads = Math.max(...leadCounts);
  const minLeads = Math.min(...leadCounts);
  
  console.log('\n📊 Análise de Leads:');
  console.log(`  Média de leads analisados: ${avgLeads.toFixed(0)}`);
  console.log(`  Máximo: ${maxLeads}`);
  console.log(`  Mínimo: ${minLeads}`);
  
  // Identificar problemas
  console.log('\n⚠️ PONTOS DE MELHORIA IDENTIFICADOS:');
  console.log('='.repeat(50));
  
  const improvements = [];
  
  // 1. Falhas
  if (failed > 0) {
    improvements.push(`❌ ${failed} perguntas falharam - verificar logs de erro`);
  }
  
  // 2. Detecção de período
  const noTemporalFilter = successfulResults.filter(r => !r.metadata.temporal_filter).length;
  if (noTemporalFilter > 0) {
    improvements.push(`📅 ${noTemporalFilter} perguntas com período não detectado`);
  }
  
  // 3. Detecção de categoria
  const noCategoryFilter = successfulResults.filter(r => !r.metadata.category_filter).length;
  if (noCategoryFilter > 0) {
    improvements.push(`🏷️ ${noCategoryFilter} perguntas com categoria não detectada`);
  }
  
  // 4. Performance
  if (duration > 60) {
    improvements.push(`⚡ Performance: ${duration.toFixed(1)}s para 50 perguntas é lento`);
  }
  
  // 5. Consistência de leads
  const inconsistentLeads = leadCounts.filter(count => count !== maxLeads).length;
  if (inconsistentLeads > 0) {
    improvements.push(`📊 ${inconsistentLeads} perguntas com número inconsistente de leads analisados`);
  }
  
  if (improvements.length === 0) {
    console.log('🎉 Nenhum ponto de melhoria crítico identificado!');
  } else {
    improvements.forEach((improvement, index) => {
      console.log(`${index + 1}. ${improvement}`);
    });
  }
  
  // Perguntas problemáticas
  console.log('\n🔍 PERGUNTAS PROBLEMÁTICAS:');
  console.log('='.repeat(50));
  
  const problematic = results.filter(r => !r.success);
  if (problematic.length > 0) {
    problematic.forEach((p, index) => {
      console.log(`${index + 1}. "${p.question}" - Erro: ${p.error}`);
    });
  } else {
    console.log('✅ Nenhuma pergunta problemática encontrada!');
  }
  
  // Salvar resultados detalhados
  const fs = require('fs');
  const detailedResults = {
    summary: {
      total: questions.length,
      successful,
      failed,
      duration,
      avgTimePerQuestion: duration / questions.length
    },
    patterns: {
      temporalFilters,
      categoryFilters,
      monthFilters,
      leadAnalysis: {
        average: avgLeads,
        max: maxLeads,
        min: minLeads
      }
    },
    improvements,
    problematicQuestions: problematic,
    allResults: results
  };
  
  fs.writeFileSync('test_results.json', JSON.stringify(detailedResults, null, 2));
  console.log('\n💾 Resultados detalhados salvos em test_results.json');
}

// Executar testes
runTests().catch(console.error);
