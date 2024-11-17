export function generateMockData(numNodes, timeSlice) {
    const data = [];
    for (let i = 0; i < numNodes; i++) {
      let outDegree, inDegree, dataSent, dataReceived, outPortsUsed, inPortsUsed;
  
      if (timeSlice === 1) {
        // 攻击刚发生：少数节点受影响，特征略有异常
        if (i < 1) { // 假设前10个节点受感染
          outDegree = Math.floor(Math.random() * 20) + 10; // 略高于正常
          inDegree = Math.floor(Math.random() * 15) + 10;
          dataSent = Math.floor(Math.random() * 1500) + 500;
          dataReceived = Math.floor(Math.random() * 1500) + 500;
          outPortsUsed = Math.floor(Math.random() * 8) + 3;
          inPortsUsed = Math.floor(Math.random() * 8) + 3;
        } else {
          outDegree = Math.floor(Math.random() * 10);
          inDegree = Math.floor(Math.random() * 10);
          dataSent = Math.floor(Math.random() * 500);
          dataReceived = Math.floor(Math.random() * 500);
          outPortsUsed = Math.floor(Math.random() * 4);
          inPortsUsed = Math.floor(Math.random() * 4);
        }
      } else if (timeSlice === 2) {
        // 攻击进行中：更多节点被感染，特征明显异常
        if (i < 10) { // 假设前50个节点受感染
          outDegree = Math.floor(Math.random() * 50) + 20; // 明显高于正常
          inDegree = Math.floor(Math.random() * 40) + 20;
          dataSent = Math.floor(Math.random() * 3000) + 1000;
          dataReceived = Math.floor(Math.random() * 3000) + 1000;
          outPortsUsed = Math.floor(Math.random() * 12) + 5;
          inPortsUsed = Math.floor(Math.random() * 12) + 5;
        } else {
          outDegree = Math.floor(Math.random() * 10);
          inDegree = Math.floor(Math.random() * 10);
          dataSent = Math.floor(Math.random() * 500);
          dataReceived = Math.floor(Math.random() * 500);
          outPortsUsed = Math.floor(Math.random() * 4);
          inPortsUsed = Math.floor(Math.random() * 4);
        }
      } else if (timeSlice === 3) {
        // 网络瘫痪后：大部分节点被感染，网络特征极端异常
        if (i < 30) { // 假设前80个节点受感染
          outDegree = Math.floor(Math.random() * 80) + 30; // 非常高
          inDegree = Math.floor(Math.random() * 70) + 30;
          dataSent = Math.floor(Math.random() * 500) + 100; // 数据量下降
          dataReceived = Math.floor(Math.random() * 500) + 100;
          outPortsUsed = Math.floor(Math.random() * 15) + 7;
          inPortsUsed = Math.floor(Math.random() * 15) + 7;
        } else {
          outDegree = Math.floor(Math.random() * 10);
          inDegree = Math.floor(Math.random() * 10);
          dataSent = Math.floor(Math.random() * 100);
          dataReceived = Math.floor(Math.random() * 100);
          outPortsUsed = Math.floor(Math.random() * 4);
          inPortsUsed = Math.floor(Math.random() * 4);
        }
      }
  
      data.push({
        id: i + 1,
        outDegree,
        inDegree,
        dataSent,
        dataReceived,
        outPortsUsed,
        inPortsUsed,
      });
    }
    return data;
  }
  
function isNodeAnomalous(data_point) {
  return data_point.outDegree > 50 || data_point.inDegree > 50 || data_point.dataSent > 1500 || data_point.dataReceived > 2000;
}

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const RadarChart = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const width = 500;
    const height = 400;
    const margin = 60;
    const radius = Math.min(width, height) / 2 - margin;

    const features = ['outDegree', 'inDegree', 'dataSent', 'dataReceived', 'outPortsUsed', 'inPortsUsed'];
    const maxValues = features.map(ft => d3.max(data, d => d[ft]));

    svg.selectAll('*').remove(); // Clear previous content

    const radialScale = d3.scaleLinear()
      .domain([0, 1]) // Normalize to [0, 1]
      .range([0, radius]);

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Add concentric circles
    const levels = 5;
    for (let i = 0; i <= levels; i++) {
      const level = i / levels;
      g.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", radialScale(level))
        .attr("fill", "none")
        .attr("stroke", "#ddd");

      g.append("text")
        .attr("x", 0)
        .attr("y", -radialScale(level) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .text((level * 100).toFixed(0) + "%");
    }

    // Draw axes and labels
    features.forEach((feature, i) => {
      const angle = (Math.PI / 2) + (2 * Math.PI * i / features.length);
      const lineCoordinate = angleToCoordinate(angle, 1);
      const labelCoordinate = angleToCoordinate(angle, 1.2);

      g.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", lineCoordinate.x)
        .attr("y2", lineCoordinate.y)
        .attr("stroke", "#bbb");

      g.append("text")
        .attr("x", labelCoordinate.x)
        .attr("y", labelCoordinate.y)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-family", "Microsoft YaHei")
        .text(feature);
    });

    // Draw data paths
    data.forEach(d => {
      const coordinates = getPathCoordinates(d);
      const isAnomalous = isNodeAnomalous(d);
      g.append("path")
        .datum(coordinates)
        .attr("d", d3.line()
          .x(d => d.x)
          .y(d => d.y))
        .attr("fill", 'none')
        .attr("stroke-width", 1)
        .attr("stroke", isAnomalous ? "red" : "steelblue")
        .attr("opacity", 0.8);
    });

    function angleToCoordinate(angle, value) {
      return {
        x: Math.cos(angle) * radialScale(value),
        y: Math.sin(angle) * radialScale(value)
      };
    }

    function getPathCoordinates(data_point) {
      const coordinates = [];
      for (let i = 0; i < features.length; i++) {
        const ft_name = features[i];
        const angle = (Math.PI / 2) + (2 * Math.PI * i / features.length);
        const value = data_point[ft_name] / maxValues[i];
        coordinates.push(angleToCoordinate(angle, value));
      }
      return coordinates;
    }

  }, [data]);

  return <svg ref={svgRef} width={500} height={500} style={{ backgroundColor: 'white', border: "1px solid #d9d9d9", borderRadius: "8px" }}></svg>;
};

export default RadarChart;
