function operator(proxies, targetPlatform, context) {
  const uniqueMap = new Map();

  return proxies.filter(proxy => {
    // 1. 基础连接属性提取
    const server = proxy.server || '';
    const port = proxy.port || '';
    const type = proxy.type || '';

    // 2. 根据不同协议提取能够区分“后端/落地”的关键特征
    // 对于 Hysteria2，SNI 是区分不同落地机房/国家的核心；
    // 对于 VMess，Path 或 Port 往往决定了不同的分流。
    let specificKey = '';
    if (type === 'hysteria2' || type === 'hy2') {
      specificKey = proxy.sni || proxy.servername || '';
    } else if (type === 'vmess' || type === 'vless') {
      // 如果是 vmess，可以结合 ws-opts 的 path 或直接靠 port 区分
      const wsPath = (proxy['ws-opts'] && proxy['ws-opts'].path) || '';
      specificKey = `${port}:${wsPath}`;
    } else {
      specificKey = `${port}`;
    }

    // 3. 构建高精度的唯一复合标识符 (服务器 + 端口 + 落地特征)
    const uniqueId = `${type}:${server}:${port}:${specificKey}`;

    if (uniqueMap.has(uniqueId)) {
      console.log(`[去重] 拦截重复节点: ${proxy.name} (${uniqueId})`);
      return false;
    } else {
      uniqueMap.set(uniqueId, true);
      return true;
    }
  });
}
