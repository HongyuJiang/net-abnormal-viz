import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export function generateTimeSeriesData() {
    const stages = ['正常阶段', '受攻击阶段', '感染扩散阶段', '网络瘫痪阶段'];
    const data = [];
    let totalTime = 0;

    stages.forEach((stage, index) => {
        let duration;
        if (index === 0) {
            duration = 20;
        } else if (index === 1) {
            duration = 14;
        } else if (index === 2) {
            duration = 20;
        } else {
            duration = 24;
        }

        for (let t = 0; t < duration; t++) {
            let sendTraffic, receiveTraffic, sendConnections, receiveConnections, anomalyNodes;

            if (index === 0) {
                sendTraffic = Math.floor(Math.random() * 100) + 50;
                receiveTraffic = Math.floor(Math.random() * 100) + 50;
                sendConnections = Math.floor(Math.random() * 3) + 2;
                receiveConnections = Math.floor(Math.random() * 3) + 2;
                anomalyNodes = 0; // No anomalies in the normal stage
            } else if (index === 1) {
                sendTraffic = Math.floor(Math.random() * 300) + 150;
                receiveTraffic = Math.floor(Math.random() * 300) + 150;
                sendConnections = Math.floor(Math.random() * 5) + 4;
                receiveConnections = Math.floor(Math.random() * 5) + 4;
                anomalyNodes = Math.floor(Math.random() * 5) + 1; // Some anomalies during attack
            } else if (index === 2) {
                sendTraffic = Math.floor(Math.random() * 500) + 300;
                receiveTraffic = Math.floor(Math.random() * 500) + 300;
                sendConnections = Math.floor(Math.random() * 10) + 5;
                receiveConnections = Math.floor(Math.random() * 10) + 5;
                anomalyNodes = Math.floor(Math.random() * 10) + 5; // More anomalies during infection
            } else {
                sendTraffic = Math.floor(Math.random() * 200) + 100;
                receiveTraffic = Math.floor(Math.random() * 200) + 100;
                sendConnections = Math.floor(Math.random() * 4) + 2;
                receiveConnections = Math.floor(Math.random() * 3) + 2;
                anomalyNodes = Math.floor(Math.random() * 15) + 10; // High anomalies during network failure
            }

            data.push({
                time: totalTime,
                stage: stage,
                sendTraffic,
                receiveTraffic,
                sendConnections,
                receiveConnections,
                anomalyNodes // Add anomaly nodes to the data object
            });

            totalTime++;
        }
    });

    return data;
}

const DualAxisStackedAreaChart = () => {
    const svgRef = useRef();

    const data = generateTimeSeriesData();

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        const width = 1250;
        const height = 800;
        const margin = { top: 50, right: 50, bottom: 30, left: 50 };

        svg.selectAll('*').remove(); // 清空之前的内容

        // 设置x轴
        const x = d3.scaleLinear()
            .domain(d3.extent(data, d => d.time))
            .range([margin.left, width - margin.right]);

        // 上侧 - 数据量
        const yTop = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.sendTraffic + d.receiveTraffic)])
            .nice()
            .range([height / 2 - margin.bottom, margin.top]);

        // 下侧 - 连接数
        const yBottom = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.sendConnections + d.receiveConnections)])
            .nice()
            .range([height - margin.bottom, height / 2 + margin.top]);

        const color = d3.scaleOrdinal()
            .domain(['sendTraffic', 'receiveTraffic', 'sendConnections', 'receiveConnections'])
            .range(['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c']); // 使用更柔和的颜色

        const stackTop = d3.stack()
            .keys(['sendTraffic', 'receiveTraffic'])
            .order(d3.stackOrderNone)
            .offset(d3.stackOffsetNone);

        const stackBottom = d3.stack()
            .keys(['sendConnections', 'receiveConnections'])
            .order(d3.stackOrderNone)
            .offset(d3.stackOffsetNone);

        const areaTop = d3.area()
            .x(d => x(d.data.time))
            .y0(d => yTop(d[0]))
            .y1(d => yTop(d[1]))
            .curve(d3.curveBasis); // 平滑曲线

        const areaBottom = d3.area()
            .x(d => x(d.data.time))
            .y0(d => yBottom(d[0]))
            .y1(d => yBottom(d[1]))
            .curve(d3.curveBasis); // 平滑曲线

        // 上侧 - 数据量堆叠区域
        svg.append('g')
            .selectAll('path')
            .data(stackTop(data))
            .join('path')
            .attr('fill', d => color(d.key))
            .attr('d', areaTop)
            .attr('opacity', 0.5);

        // 下侧 - 连接数堆叠区域
        svg.append('g')
            .selectAll('path')
            .data(stackBottom(data))
            .join('path')
            .attr('fill', d => color(d.key))
            .attr('d', areaBottom)
            .attr('opacity', 0.5);

        // 添加x轴
        svg.append('g')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x));

        // 添加上侧y轴 - 数据量
        svg.append('g')
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(yTop))
            .append('text')
            .attr('fill', 'black')
            .attr('font-size', 14)
            .attr('x', -margin.left)
            .attr('y', margin.top - 20)
            .text('数据量 (Bytes)');

        // 添加下侧y轴 - 连接数
        svg.append('g')
            .attr('transform', `translate(${margin.left},${height / 2})`)
            .call(d3.axisLeft(yBottom))
            .append('text')
            .attr('fill', 'black')
            .attr('font-size', 14)
            .attr('x', -margin.left)
            .attr('y', margin.top - 20)
            .text('连接数');

        // 添加图例
        const legend = svg.append('g')
            .attr('transform', `translate(${80},${margin.top})`);

        const legendKeys = [
            { key: 'sendTraffic', color: '#a6cee3', label: '发送数据量' },
            { key: 'receiveTraffic', color: '#1f78b4', label: '接收数据量' },
            { key: 'sendConnections', color: '#b2df8a', label: '发送连接数' },
            { key: 'receiveConnections', color: '#33a02c', label: '接收连接数' }
        ];

        legend.selectAll('rect')
            .data(legendKeys)
            .enter()
            .append('rect')
            .attr('x', 0)
            .attr('y', (d, i) => i * 20)
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', d => d.color);

        legend.selectAll('text')
            .data(legendKeys)
            .enter()
            .append('text')
            .attr('x', 24)
            .attr('y', (d, i) => i * 20 + 9)
            .attr('dy', '0.35em')
            .text(d => d.label);

    }, [data]);

    return <svg ref={svgRef} width={1250} height={800}></svg>;
};

export default DualAxisStackedAreaChart;
