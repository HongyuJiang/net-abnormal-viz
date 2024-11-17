import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Button } from 'antd';

const NetworkGraph = ({ node_num = 500 }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const svgRef = useRef();
  const thumbnailRef = useRef();
  const tooltipRef = useRef();
  const nodePositions = useRef({});

  const generateMockData = (stage) => {
    const nodes = Array.from({ length: node_num }, (_, i) => ({
      id: i,
      infected: false,
      connections: new Set(),
      ports: Array.from({ length: 5 }, () => Math.random() < 0.5),
      x: nodePositions.current[i]?.x || null,
      y: nodePositions.current[i]?.y || null,
    }));

    // Introduce hub nodes
    const hubCount = Math.floor(node_num * 0.02); // 10% as hub nodes
    const isolatedCount = Math.floor(node_num * 0.1); // 10% as isolated nodes

    for (let i = 0; i < hubCount; i++) {
      const hubNodeIndex = Math.floor(Math.random() * node_num);
      const numConnections = Math.floor(Math.random() * 20) + 10; // More connections for hubs
      while (nodes[hubNodeIndex].connections.size < numConnections) {
        const target = Math.floor(Math.random() * node_num);
        if (target !== hubNodeIndex) {
          nodes[hubNodeIndex].connections.add(target);
          nodes[target].connections.add(hubNodeIndex);
        }
      }
    }

    // Create isolated nodes
    const isolatedNodeIndices = [];
    for (let i = 0; i < isolatedCount; i++) {
      let isolatedNodeIndex;
      do {
        isolatedNodeIndex = Math.floor(Math.random() * node_num);
      } while (isolatedNodeIndices.includes(isolatedNodeIndex));
      isolatedNodeIndices.push(isolatedNodeIndex);
    }

    // Connect normal nodes
    nodes.forEach(node => {
      if (!isolatedNodeIndices.includes(node.id)) {
        const numConnections = Math.floor(Math.random() * 3) + 1;
        while (node.connections.size < numConnections) {
          const target = Math.floor(Math.random() * node_num);
          if (target !== node.id && !isolatedNodeIndices.includes(target)) {
            node.connections.add(target);
            nodes[target].connections.add(node.id);
          }
        }
      }
    });

    // Infected nodes
    if (stage > 0) {
      const infectedCount = Math.min(stage * 5, node_num);
      for (let i = 0; i < infectedCount; i++) {
        nodes[i].infected = true;
        const newConnections = Math.floor(Math.random() * 5) + 3;
        for (let j = 0; j < newConnections; j++) {
          const target = Math.floor(Math.random() * node_num);
          if (target !== i && !isolatedNodeIndices.includes(target)) {
            nodes[i].connections.add(target);
            nodes[target].connections.add(i);
          }
        }
      }
    }

    const abnormalNodeIds = [/* 异常节点的 ID 列表 */];
    const linksMap = new Map(); // 用于跟踪连接频率

    nodes.forEach(node => {
      if (!isolatedNodeIndices.includes(node.id)) {
        const numConnections = Math.floor(Math.random() * 3) + 1;
        while (node.connections.size < numConnections) {
          const target = Math.floor(Math.random() * node_num);
          if (target !== node.id && !isolatedNodeIndices.includes(target)) {
            node.connections.add(target);
            nodes[target].connections.add(node.id);

            // 更新 linksMap
            const linkKey = [node.id, target].sort().join('-');
            linksMap.set(linkKey, (linksMap.get(linkKey) || 0) + 1);
          }
        }
      }
    });

    // 创建链接并考虑异常节点的放大系数
    const links = nodes.flatMap(node =>
      Array.from(node.connections).map(target => {
        const frequency = linksMap.get([node.id, target].sort().join('-'));
        const isAbnormalConnection = abnormalNodeIds.includes(node.id) || abnormalNodeIds.includes(target);
        const scaleFactor = isAbnormalConnection ? 2 : 1; // 放大系数

        return {
          source: node.id,
          target: target,
          frequency: frequency * scaleFactor // 调整频率
        };
      })
    );
    return { nodes, links };
  };

  const getNodeRadius = (degree) => Math.sqrt(degree) * 2 + 3;

  useEffect(() => {
    const data = generateMockData(currentStage);
    const width = 1200;
    const height = 600;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const graphGroup = svg.append('g');
    const legendGroup = svg.append('g').attr('transform', 'translate(20, 20)');

    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links).id(d => d.id))
      .force('charge', d3.forceManyBody().strength(-50))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = graphGroup.append('g')
      .selectAll('line')
      .data(data.links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', d => d.frequency / 10); // Adjust width based on frequency

    const node = graphGroup.append('g')
      .selectAll('circle')
      .data(data.nodes)
      .enter().append('circle')
      .attr('r', d => getNodeRadius(d.connections.size))
      .attr('fill', d => d.infected ? '#ff0000' : '#1f77b4')
      .attr('opacity', 0.8)
      .on('mouseover', (event, d) => showTooltip(event, d))
      .on('mouseout', hideTooltip)
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    node.append('title')
      .text(d => `Node ${d.id}\nDegree: ${d.connections.size}`);

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    });

    const updateThumbnail = () => {
      const thumbnailWidth = 300;
      const thumbnailHeight = 150;

      if (thumbnailRef.current) {
        d3.select(thumbnailRef.current).selectAll('*').remove();
        const thumbnail = d3.select(thumbnailRef.current).append('g');

        thumbnail.selectAll('line')
          .data(data.links)
          .enter().append('line')
          .attr('x1', d => data.nodes[d.source.id].x * (thumbnailWidth / width))
          .attr('y1', d => data.nodes[d.source.id].y * (thumbnailHeight / height))
          .attr('x2', d => data.nodes[d.target.id].x * (thumbnailWidth / width))
          .attr('y2', d => data.nodes[d.target.id].y * (thumbnailHeight / height))
          .attr('stroke', '#999')
          .attr('stroke-opacity', 0);

        thumbnail.selectAll('circle')
          .data(data.nodes)
          .enter().append('circle')
          .attr('cx', d => d.x * (thumbnailWidth / width))
          .attr('cy', d => d.y * (thumbnailHeight / height))
          .attr('r', d => getNodeRadius(d.connections.size) * (thumbnailWidth / width))
          .attr('fill', d => d.infected ? '#ff0000' : '#1f77b4')
          .attr('opacity', 0.8);
      }
    };

    simulation.on('end', () => {
      data.nodes.forEach(node => {
        nodePositions.current[node.id] = { x: node.x, y: node.y };
      });
      updateThumbnail();
    });

    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        graphGroup.attr('transform', event.transform);
      });

    d3.select(svgRef.current).call(zoom);

    // Legend
    legendGroup.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 5)
      .style('fill', '#1f77b4');

    legendGroup.append('circle')
      .attr('cx', 0)
      .attr('cy', 20)
      .attr('r', 5)
      .style('fill', '#ff0000');

    legendGroup.append('text')
      .attr('x', 10)
      .attr('y', 0)
      .text('Normal Node')
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle');

    legendGroup.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .text('Infected Node')
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle');

  }, [currentStage]);

  function selectRandomElements(array, count) {
    const shuffledArray = array.slice();
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray.slice(0, count);
  }

  const showTooltip = (event, node) => {
    const tooltip = d3.select(tooltipRef.current);
    const commonPorts = ['80', '443', '22', '3306', '8080', '5432', '5000', '25', '21', '110', '143', '993', '995', '1024']
    const randomPorts = selectRandomElements(commonPorts, Math.round(Math.random() * 5))
    const portsUsage = randomPorts.map(port => ({ port, used: Math.random() * 100 }));

    const pie = d3.pie().value(d => d.used);
    const arc = d3.arc().innerRadius(0).outerRadius(50);

    const tooltipWidth = 200;
    const tooltipHeight = 150;

    tooltip.style('opacity', 1)
      .style('left', `${event.pageX - 230}px`)
      .style('top', `${event.pageY - 140}px`);

    tooltip.select('h4').text(`Node ID: ${node.id}`);
    tooltip.select('p').text(`Status: ${node.infected ? 'Infected' : 'Normal'}`);
    tooltip.select('span').text(`Type: ${Math.random() > 0.9 ? 'Server' : 'Host'}`);

    const g = tooltip.select('svg')
      .attr('width', tooltipWidth)
      .attr('height', tooltipHeight)
      .select('g');

    g.selectAll('*').remove();

    const arcs = g.selectAll('path')
      .data(pie(portsUsage))
      .enter().append('path')
      .attr('d', arc)
      .attr('transform', `translate(${tooltipWidth / 2}, ${tooltipHeight / 2})`)
      .style('fill', (d, i) => d.data.used ? d3.schemeCategory10[i % 10] : '#ccc')
      .style('opacity', 0.5);

    // 添加文本标签并进行旋转
    g.selectAll('text')
      .data(pie(portsUsage))
      .enter().append('text')
      .attr('transform', (d) => {
        const [x, y] = arc.centroid(d);
        const angle = (d.startAngle + d.endAngle) / 2; // 计算中间角度
        return `translate(${x + 100}, ${y + 75}) rotate(${(angle * 180 / Math.PI) - 90})`; // 旋转文本
      })
      .attr('dy', '0.35em')
      .attr('text-anchor', 'start')
      .text(d => `Port ${d.data.port}`);

  };

  const hideTooltip = () => {
    d3.select(tooltipRef.current).style('opacity', 0);
  };

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={svgRef}></svg>
      <svg ref={thumbnailRef} style={{ position: 'absolute', top: 10, right: 10, border: "grey 1px solid" }}></svg>
      <div ref={tooltipRef} style={{ position: 'absolute', opacity: 0, background: 'white', border: '1px solid #ccc', padding: '5px', borderRadius: '5px', pointerEvents: 'none' }}>
        <h4></h4>
        <span></span>: <p></p>
        <svg><g></g></svg>
      </div>
      <div>
        <Button onClick={() => setCurrentStage(prev => Math.max(0, prev - 1))}>Previous Tick</Button>
        <Button onClick={() => setCurrentStage(prev => Math.min(5, prev + 1))}>Next Tick</Button>
      </div>
    </div>
  );
};

export default NetworkGraph;