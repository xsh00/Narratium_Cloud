/**
 * 性能监控工具
 * 提供统一的性能监控功能，用于分析各个阶段的耗时
 */

export interface PerformanceStage {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

export interface PerformanceMonitor {
  id: string;
  startTime: number;
  stages: PerformanceStage[];
  totalDuration?: number;
}

class PerformanceMonitorManager {
  private monitors: Map<string, PerformanceMonitor> = new Map();

  /**
   * 开始监控一个新的操作
   */
  startMonitor(id: string, description?: string): void {
    const monitor: PerformanceMonitor = {
      id,
      startTime: Date.now(),
      stages: [],
    };
    
    this.monitors.set(id, monitor);
    console.log(`🚀 [性能监控] 开始监控: ${id}${description ? ` - ${description}` : ''} - 时间: ${new Date().toISOString()}`);
  }

  /**
   * 开始一个阶段
   */
  startStage(monitorId: string, stageName: string): void {
    const monitor = this.monitors.get(monitorId);
    if (!monitor) {
      console.warn(`⚠️ [性能监控] 监控器不存在: ${monitorId}`);
      return;
    }

    const stage: PerformanceStage = {
      name: stageName,
      startTime: Date.now(),
    };
    
    monitor.stages.push(stage);
    console.log(`🔄 [性能监控] ${monitorId} - 开始阶段: ${stageName}`);
  }

  /**
   * 结束一个阶段
   */
  endStage(monitorId: string, stageName: string): void {
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

  /**
   * 结束监控并输出完整报告
   */
  endMonitor(monitorId: string): PerformanceMonitor | null {
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
        const percentage = ((stage.duration / monitor.totalDuration!) * 100).toFixed(1);
        console.log(`   - ${stage.name}: ${stage.duration}ms (${percentage}%)`);
      }
    });
    
    console.log(`   - 总耗时: ${monitor.totalDuration}ms`);
    
    this.monitors.delete(monitorId);
    return monitor;
  }

  /**
   * 记录错误
   */
  recordError(monitorId: string, error: any): void {
    const monitor = this.monitors.get(monitorId);
    if (!monitor) {
      console.warn(`⚠️ [性能监控] 监控器不存在: ${monitorId}`);
      return;
    }

    const errorTime = Date.now() - monitor.startTime;
    console.error(`❌ [性能监控] ${monitorId} - 执行失败 - 耗时: ${errorTime}ms:`, error);
  }

  /**
   * 获取监控器
   */
  getMonitor(monitorId: string): PerformanceMonitor | undefined {
    return this.monitors.get(monitorId);
  }

  /**
   * 清理所有监控器
   */
  clearAll(): void {
    this.monitors.clear();
    console.log(`🧹 [性能监控] 清理所有监控器`);
  }
}

// 创建全局实例
export const performanceMonitor = new PerformanceMonitorManager();

/**
 * 性能监控装饰器（用于函数）
 */
export function monitorPerformance(monitorId: string, description?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      performanceMonitor.startMonitor(monitorId, description);
      
      try {
        const result = await method.apply(this, args);
        performanceMonitor.endMonitor(monitorId);
        return result;
      } catch (error) {
        performanceMonitor.recordError(monitorId, error);
        throw error;
      }
    };
  };
}

/**
 * 性能监控高阶函数
 */
export function withPerformanceMonitoring<T extends any[], R>(
  monitorId: string,
  fn: (...args: T) => Promise<R>,
  description?: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    performanceMonitor.startMonitor(monitorId, description);
    
    try {
      const result = await fn(...args);
      performanceMonitor.endMonitor(monitorId);
      return result;
    } catch (error) {
      performanceMonitor.recordError(monitorId, error);
      throw error;
    }
  };
}

/**
 * 创建阶段监控器
 */
export function createStageMonitor(monitorId: string, description?: string) {
  performanceMonitor.startMonitor(monitorId, description);
  
  return {
    startStage: (stageName: string) => performanceMonitor.startStage(monitorId, stageName),
    endStage: (stageName: string) => performanceMonitor.endStage(monitorId, stageName),
    end: () => performanceMonitor.endMonitor(monitorId),
    error: (error: any) => performanceMonitor.recordError(monitorId, error),
  };
} 