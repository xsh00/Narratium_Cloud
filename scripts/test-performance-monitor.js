/**
 * 性能监控工具测试脚本
 * 用于验证性能监控功能是否正常工作
 */

// 模拟性能监控工具
class PerformanceMonitorManager {
  constructor() {
    this.monitors = new Map();
  }

  startMonitor(id, description) {
    const monitor = {
      id,
      startTime: Date.now(),
      stages: [],
    };
    
    this.monitors.set(id, monitor);
    console.log(`🚀 [性能监控] 开始监控: ${id}${description ? ` - ${description}` : ''} - 时间: ${new Date().toISOString()}`);
  }

  startStage(monitorId, stageName) {
    const monitor = this.monitors.get(monitorId);
    if (!monitor) {
      console.warn(`⚠️ [性能监控] 监控器不存在: ${monitorId}`);
      return;
    }

    const stage = {
      name: stageName,
      startTime: Date.now(),
    };
    
    monitor.stages.push(stage);
    console.log(`🔄 [性能监控] ${monitorId} - 开始阶段: ${stageName}`);
  }

  endStage(monitorId, stageName) {
    const monitor = this.monitors.get(monitorId);
    if (!monitor) {
      console.warn(`⚠️ [性能监控] 监控器不存在: ${monitorId}`);
      return;
    }

    const stage = monitor.stages.find(s => s.name === stageName);
    if (!stage) {
      console.warn(`⚠️ [性能监控] 阶段不存在: ${monitorId} - ${stageName}`);
      return;
    }

    stage.endTime = Date.now();
    stage.duration = stage.endTime - stage.startTime;
    
    console.log(`✅ [性能监控] ${monitorId} - 阶段完成: ${stageName} - 耗时: ${stage.duration}ms`);
  }

  endMonitor(monitorId) {
    const monitor = this.monitors.get(monitorId);
    if (!monitor) {
      console.warn(`⚠️ [性能监控] 监控器不存在: ${monitorId}`);
      return null;
    }

    monitor.totalDuration = Date.now() - monitor.startTime;
    
    console.log(`🎉 [性能监控] 监控完成: ${monitorId} - 总耗时: ${monitor.totalDuration}ms`);
    console.log(`📊 [性能监控] ${monitorId} - 各阶段耗时统计:`);
    
    monitor.stages.forEach(stage => {
      if (stage.duration !== undefined) {
        const percentage = ((stage.duration / monitor.totalDuration) * 100).toFixed(1);
        console.log(`   - ${stage.name}: ${stage.duration}ms (${percentage}%)`);
      }
    });
    
    console.log(`   - 总耗时: ${monitor.totalDuration}ms`);
    
    this.monitors.delete(monitorId);
    return monitor;
  }

  recordError(monitorId, error) {
    const monitor = this.monitors.get(monitorId);
    if (!monitor) {
      console.warn(`⚠️ [性能监控] 监控器不存在: ${monitorId}`);
      return;
    }

    const errorTime = Date.now() - monitor.startTime;
    console.error(`❌ [性能监控] ${monitorId} - 执行失败 - 耗时: ${errorTime}ms:`, error);
  }
}

const performanceMonitor = new PerformanceMonitorManager();

// 模拟异步操作
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 测试函数
async function testPerformanceMonitoring() {
  console.log('🧪 开始测试性能监控功能...\n');

  // 测试1: 基本监控
  console.log('📋 测试1: 基本监控功能');
  performanceMonitor.startMonitor('test-basic', '基本监控测试');
  
  performanceMonitor.startStage('test-basic', '准备阶段');
  await sleep(100);
  performanceMonitor.endStage('test-basic', '准备阶段');
  
  performanceMonitor.startStage('test-basic', '执行阶段');
  await sleep(200);
  performanceMonitor.endStage('test-basic', '执行阶段');
  
  performanceMonitor.startStage('test-basic', '清理阶段');
  await sleep(50);
  performanceMonitor.endStage('test-basic', '清理阶段');
  
  performanceMonitor.endMonitor('test-basic');
  console.log('');

  // 测试2: 错误处理
  console.log('📋 测试2: 错误处理');
  performanceMonitor.startMonitor('test-error', '错误处理测试');
  
  performanceMonitor.startStage('test-error', '正常阶段');
  await sleep(100);
  performanceMonitor.endStage('test-error', '正常阶段');
  
  performanceMonitor.startStage('test-error', '错误阶段');
  await sleep(50);
  performanceMonitor.recordError('test-error', new Error('模拟错误'));
  
  performanceMonitor.endMonitor('test-error');
  console.log('');

  // 测试3: 模拟角色聊天流程
  console.log('📋 测试3: 模拟角色聊天流程');
  performanceMonitor.startMonitor('character-chat', '角色聊天流程测试');
  
  // 前端阶段
  performanceMonitor.startStage('character-chat', '前端-添加用户消息');
  await sleep(10);
  performanceMonitor.endStage('character-chat', '前端-添加用户消息');
  
  performanceMonitor.startStage('character-chat', '前端-加载配置');
  await sleep(5);
  performanceMonitor.endStage('character-chat', '前端-加载配置');
  
  // API阶段
  performanceMonitor.startStage('character-chat', 'API-工作流创建');
  await sleep(20);
  performanceMonitor.endStage('character-chat', 'API-工作流创建');
  
  performanceMonitor.startStage('character-chat', 'API-工作流执行');
  await sleep(1500); // 模拟LLM调用时间
  performanceMonitor.endStage('character-chat', 'API-工作流执行');
  
  performanceMonitor.startStage('character-chat', 'API-后处理');
  await sleep(100);
  performanceMonitor.endStage('character-chat', 'API-后处理');
  
  // 前端响应阶段
  performanceMonitor.startStage('character-chat', '前端-响应解析');
  await sleep(15);
  performanceMonitor.endStage('character-chat', '前端-响应解析');
  
  performanceMonitor.startStage('character-chat', '前端-UI更新');
  await sleep(25);
  performanceMonitor.endStage('character-chat', '前端-UI更新');
  
  performanceMonitor.endMonitor('character-chat');
  console.log('');

  console.log('✅ 性能监控功能测试完成！');
  console.log('\n💡 提示: 在实际使用中，这些日志会显示在浏览器控制台中，');
  console.log('   帮助你分析角色卡界面发送消息时各个阶段的耗时。');
}

// 运行测试
testPerformanceMonitoring().catch(console.error); 