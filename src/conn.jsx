import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const NetworkGraph = ({ node_num = 100 }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const svgRef = useRef();
  const thumbnailRef = useRef();
  const nodePositions = useRef({});

  const generateMockData = (stage) => {
    const nodes = Array.from({ length: node_num }, (_, i) => ({
      id: i,
      infected: false,
      connections: new Set(),
      x: nodePositions.current[i]?.x || null,
      y: nodePositions.current[i]?.y || null,
    }));

    nodes.forEach(node => {
      const numConnections = Math.floor(Math.random() * 3) + 1;
      while (node.connections.size < numConnections) {
        const target = Math.floor(Math.random() * node_num);
        if (target !== node.id) {
          node.connections.add(target);
          nodes[target].connections.add(node.id);
        }
      }
    });

    if (stage > 0) {
      const infectedCount = Math.min(stage * 5, node_num);
      for (let i = 0; i < infectedCount; i++) {
        nodes[i].infected = true;
        const newConnections = Math.floor(Math.random() * 5) + 3;
        for (let j = 0; j < newConnections; j++) {
          const target = Math.floor(Math.random() * node_num);
          if (target !== i) {
            nodes[i].connections.add(target);
            nodes[target].connections.add(i);
          }
        }
      }
    }

    const links = nodes.flatMap(node =>
      Array.from(node.connections).map(target => ({
        source: node.id,
        target: target
      }))
    );

    return { nodes, links };
  };

  const getNodeRadius = (degree) => {
    return Math.sqrt(degree) * 3 + 3;
  };

  useEffect(() => {
    const data = generateMockData(currentStage);
    const width = 1200;
    const height = 600;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove();

    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links).id(d => d.id))
      .force('charge', d3.forceManyBody().strength(-10))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .selectAll('line')
      .data(data.links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6);

    const node = svg.append('g')
      .selectAll('circle')
      .data(data.nodes)
      .enter().append('circle')
      .attr('r', d => getNodeRadius(d.connections.size))
      .attr('fill', d => d.infected ? '#ff0000' : '#1f77b4')
      .attr('opacity', 0.8)
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

    if (Object.keys(nodePositions.current).length > 0) {
      simulation.stop();
      data.nodes.forEach(node => {
        node.x = nodePositions.current[node.id].x;
        node.y = nodePositions.current[node.id].y;
      });

      node.attr('cx', d => d.x)
        .attr('cy', d => d.y);

      link.attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
    } else {
      simulation.on('end', () => {
        data.nodes.forEach(node => {
          nodePositions.current[node.id] = { x: node.x, y: node.y };
        });
      });
    }

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

    // Thumbnail creation
    const thumbnailWidth = 300;
    const thumbnailHeight = 150;

    console.log(thumbnailRef.current)

    if (thumbnailRef.current) {

      
      const thumbnail = d3.select(thumbnailRef.current)
        .attr('width', thumbnailWidth)
        .attr('height', thumbnailHeight)
        .selectAll('*').remove();

      // Draw nodes and links in thumbnail
      thumbnail.selectAll('line')
        .data(data.links)
        .enter().append('line')
        .attr('x1', d => data.nodes[d.source].x * (thumbnailWidth / width))
        .attr('y1', d => data.nodes[d.source].y * (thumbnailHeight / height))
        .attr('x2', d => data.nodes[d.target].x * (thumbnailWidth / width))
        .attr('y2', d => data.nodes[d.target].y * (thumbnailHeight / height))
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6);

      thumbnail.selectAll('circle')
        .data(data.nodes)
        .enter().append('circle')
        .attr('cx', d => d.x * (thumbnailWidth / width))
        .attr('cy', d => d.y * (thumbnailHeight / height))
        .attr('r', d => getNodeRadius(d.connections.size) * (thumbnailWidth / width))
        .attr('fill', d => d.infected ? '#ff0000' : '#1f77b4')
        .attr('opacity', 0.8);
    }

    // Zoom functionality
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])  // Min and max zoom levels
      .on('zoom', (event) => {
        svg.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Legend
    const legend = svg.append('g')
      .attr('transform', 'translate(20, 20)');

    legend.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 5)
      .style('fill', '#1f77b4');

    legend.append('circle')
      .attr('cx', 0)
      .attr('cy', 20)
      .attr('r', 5)
      .style('fill', '#ff0000');

    legend.append('text')
      .attr('x', 10)
      .attr('y', 0)
      .text('Normal Node')
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle');

    legend.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .text('Infected Node')
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle');

  }, [currentStage, thumbnailRef.current]);

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={svgRef}></svg>
      <svg ref={thumbnailRef} style={{ position: 'absolute', top: 10, right: 10 }}></svg>
      <div>
        <button onClick={() => setCurrentStage(prev => Math.max(0, prev - 1))}>Previous Stage</button>
        <button onClick={() => setCurrentStage(prev => Math.min(5, prev + 1))}>Next Stage</button>
        <p>Current Stage: {currentStage}</p>
      </div>
    </div>
  );
};

export default NetworkGraph;