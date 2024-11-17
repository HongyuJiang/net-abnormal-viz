import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const portColors = {
  'SSH': '#2C3E50', // 深灰蓝，给人一种稳重、专业的感觉
  'RDP': '#E67E22', // 温暖的橙色，适合突出需要注意的项
  'HTTP': '#3498DB', // 温和的蓝色，代表常见的 HTTP 流量
  'HTTPS': '#2ECC71', // 清新的绿色，代表安全的 HTTPS 流量
  'FTP': '#9B59B6', // 高雅的紫色，给人一种专业、现代的印象
  'DNS': '#1ABC9C', // 浅绿色，清新、具有科技感
};


// 生成与 ATP 攻击者模式相符的端口使用数据
const generatePortUsageData = (rows, columns) => {
  const commonPorts = ['SSH', 'RDP', 'HTTP', 'HTTPS', 'FTP', 'DNS'];
  const data = [];
  
  for (let i = 0; i < rows; i++) {
    const nodeData = { nodeId: `Node-${Math.floor(Math.random() * 1000)}`, ports: [] };
    
    for (let j = 0; j < columns; j++) {
      const port = commonPorts[Math.floor(Math.random() * commonPorts.length)];
      const frequency = Math.floor(Math.random() * 10) + 5; // 假设频次范围为 5 到 15
      nodeData.ports.push({ port, frequency });
    }
    data.push(nodeData);
  }
  return data;
};

const MatrixVisualization = ({ rows = 5, columns = 8 }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const cellSize = 40;
    const portUsageData = generatePortUsageData(rows, columns);

    // 绘制节点和端口
    for (let i = 0; i < rows; i++) {
      const nodeData = portUsageData[i];

      // Add text for the node ID
      svg.append('text')
        .attr('x', 0)
        .attr('y', i * cellSize + cellSize / 2 + 5)
        .attr('text-anchor', 'start')
        .text(nodeData.nodeId)
        .style('font-size', '12px')
        .style('fill', 'black');

      // 按频次从大到小排序端口
      const sortedPorts = nodeData.ports.sort((a, b) => b.frequency - a.frequency);

      sortedPorts.forEach((portData, j) => {
        const radius = portData.frequency * 1.; // Scale radius by frequency
        svg.append('circle')
          .attr('cx', j * cellSize + cellSize / 2 + 100) // Adjust x position
          .attr('cy', i * cellSize + cellSize / 2)
          .attr('r', radius)
          .style('fill', portColors[portData.port]) // Map color based on port
          .style('opacity', 0.8);
      });
    }

    // 绘制图例
    const legendX = 450; // 图例的 X 坐标
    const legendY = 20; // 图例的 Y 坐标
    const legendSpacing = 20; // 图例间距

    Object.keys(portColors).forEach((port, index) => {
      svg.append('rect')
        .attr('x', legendX)
        .attr('y', legendY + index * legendSpacing)
        .attr('width', 15)
        .attr('height', 15)
        .style('fill', portColors[port])
        .style('opacity', 0.8);

      svg.append('text')
        .attr('x', legendX + 20) // 文本 X 坐标
        .attr('y', legendY + index * legendSpacing + 12) // 文本 Y 坐标
        .text(port)
        .style('font-size', '12px')
        .style('fill', 'black');
    });

  }, [rows, columns]);

  return <svg ref={svgRef} width={600} height={300} />;
};

export default MatrixVisualization;