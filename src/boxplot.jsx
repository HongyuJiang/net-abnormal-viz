import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Select } from 'antd';

function generateMockData(numNodes, timeSlice) {
    const data = [];
    const abnormalNodes = [];
    for (let i = 0; i < numNodes; i++) {
        let outDegree, inDegree, dataSent, dataReceived, outPortsUsed, inPortsUsed;

        if (timeSlice === 1) {
            // 攻击刚发生：少数节点受影响，特征略有异常
            if (i < 10) { // 假设前 10 个节点受感染
                outDegree = Math.floor(Math.random() * 20) + 10; // 略高于正常
                inDegree = Math.floor(Math.random() * 15) + 10;
                dataSent = Math.floor(Math.random() * 1500) + 500;
                dataReceived = Math.floor(Math.random() * 1500) + 500;
                outPortsUsed = Math.floor(Math.random() * 8) + 3;
                inPortsUsed = Math.floor(Math.random() * 8) + 3;
                abnormalNodes.push(i + 1);
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
            if (i < 50) { // 假设前 50 个节点受感染
                outDegree = Math.floor(Math.random() * 50) + 20; // 明显高于正常
                inDegree = Math.floor(Math.random() * 40) + 20;
                dataSent = Math.floor(Math.random() * 3000) + 1000;
                dataReceived = Math.floor(Math.random() * 3000) + 1000;
                outPortsUsed = Math.floor(Math.random() * 12) + 5;
                inPortsUsed = Math.floor(Math.random() * 12) + 5;
                abnormalNodes.push(i + 1);
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
            if (i < 80) { // 假设前 80 个节点受感染
                outDegree = Math.floor(Math.random() * 80) + 30; // 非常高
                inDegree = Math.floor(Math.random() * 70) + 30;
                dataSent = Math.floor(Math.random() * 500) + 100; // 数据量下降
                dataReceived = Math.floor(Math.random() * 500) + 100;
                outPortsUsed = Math.floor(Math.random() * 15) + 7;
                inPortsUsed = Math.floor(Math.random() * 15) + 7;
                abnormalNodes.push(i + 1);
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
    return { data, abnormalNodes };
}

const BoxPlot = () => {
    const [selectedMetric, setSelectedMetric] = useState('dataSent');
    const [selectedTimeSlice, setSelectedTimeSlice] = useState(1);
    const [data, setData] = useState([]);
    const [abnormalNodes, setAbnormalNodes] = useState([]);
    const svgRef = useRef();

    // 模拟获取数据的函数，这里假设数据在组件挂载时获取
    const fetchData = () => {
        const numNodes = 100;
        const { data: mockData, abnormalNodes: mockAbnormalNodes } = generateMockData(numNodes, selectedTimeSlice);
        setData(mockData);
        setAbnormalNodes(mockAbnormalNodes);
    };

    // 在组件挂载时和时间片变化时获取数据
    useEffect(() => {
        fetchData();
    }, [selectedTimeSlice]);

    // 根据指标名称获取数据值数组
    const getDataValuesByMetric = () => {
        const normalNodesData = data.filter(node => !abnormalNodes.includes(node.id)).map(node => node[selectedMetric]);
        const abnormalNodesData = data.filter(node => abnormalNodes.includes(node.id)).map(node => node[selectedMetric]);
        return { normalNodesData, abnormalNodesData };
    };

    useEffect(() => {
        drawBoxPlot();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, abnormalNodes, selectedMetric]);

    const drawBoxPlot = () => {
        const { normalNodesData, abnormalNodesData } = getDataValuesByMetric();

        // Check if we have data for both normal and abnormal nodes
        if (normalNodesData.length === 0 && abnormalNodesData.length === 0) {
            console.warn("No data available for drawing the box plot.");
            return;
        }

        const margin = { top: 30, right: 150, bottom: 30, left: 60 };
        const width = 600 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        // Select the SVG element
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous drawings

        // Create a group element
        const g = svg
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const boxPlotData = [
            { category: '正常节点', values: normalNodesData, color: '#1f77b4' }, // Blue
            { category: '异常节点', values: abnormalNodesData, color: '#d62728' }, // Red
        ];

        const xScale = d3.scaleBand()
            .domain(boxPlotData.map(d => d.category))
            .range([0, width])
            .padding(0.5);

        const allValues = boxPlotData.flatMap(d => d.values);
        const yMin = d3.min(allValues) * 0.95;
        const yMax = d3.max(allValues) * 1.05;

        const yScale = d3.scaleLinear()
            .domain([yMin, yMax])
            .range([height, 0])
            .nice();

        // Add X axis
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('font-size', '12px');

        // Add Y axis
        g.append('g')
            .call(d3.axisLeft(yScale))
            .selectAll('text')
            .style('font-size', '12px');

        // Add Y axis label
        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', `translate(${-40}, ${height / 2}) rotate(-90)`)
            .style('font-size', '14px')
            .text(getMetricLabel(selectedMetric));

        // Gridlines
        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(yScale)
                .tickSize(-width)
                .tickFormat('')
            )
            .attr('stroke-opacity', 0.1);

        // Tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('background', '#f9f9f9')
            .style('padding', '8px')
            .style('border', '1px solid #d3d3d3')
            .style('border-radius', '4px')
            .style('pointer-events', 'none')
            .style('font-size', '12px')
            .style('display', 'none');

        // Function to calculate quartiles and IQR
        const getBoxPlotStatistics = (data) => {
            const sorted = data.slice().sort(d3.ascending);
            const q1 = d3.quantile(sorted, 0.25);
            const median = d3.quantile(sorted, 0.5);
            const q3 = d3.quantile(sorted, 0.75);
            const interQuantileRange = q3 - q1;
            const min = d3.max([d3.min(sorted), q1 - 1.5 * interQuantileRange]);
            const max = d3.min([d3.max(sorted), q3 + 1.5 * interQuantileRange]);
            return { q1, median, q3, min, max };
        };

        // Draw box plots
        boxPlotData.forEach(d => {
            const stats = getBoxPlotStatistics(d.values);
            const xPos = xScale(d.category);

            // Draw the box
            g.append('rect')
                .attr('x', xPos - xScale.bandwidth() / 4)
                .attr('y', yScale(stats.q3))
                .attr('width', xScale.bandwidth() / 2)
                .attr('height', yScale(stats.q1) - yScale(stats.q3))
                .attr('fill', d.color)
                .attr('opacity', 0.6);

            // Draw the median line
            g.append('line')
                .attr('x1', xPos - xScale.bandwidth() / 4)
                .attr('x2', xPos + xScale.bandwidth() / 4)
                .attr('y1', yScale(stats.median))
                .attr('y2', yScale(stats.median))
                .attr('stroke', 'black')
                .attr('stroke-width', 2);

            // Draw the whiskers
            g.append('line')
                .attr('x1', xPos)
                .attr('x2', xPos)
                .attr('y1', yScale(stats.max))
                .attr('y2', yScale(stats.q3))
                .attr('stroke', 'black')
                .attr('stroke-width', 1.5);

            g.append('line')
                .attr('x1', xPos)
                .attr('x2', xPos)
                .attr('y1', yScale(stats.min))
                .attr('y2', yScale(stats.q1))
                .attr('stroke', 'black')
                .attr('stroke-width', 1.5);

            // Draw the whisker caps
            g.append('line')
                .attr('x1', xPos - xScale.bandwidth() / 8)
                .attr('x2', xPos + xScale.bandwidth() / 8)
                .attr('y1', yScale(stats.max))
                .attr('y2', yScale(stats.max))
                .attr('stroke', 'black')
                .attr('stroke-width', 1.5);

            g.append('line')
                .attr('x1', xPos - xScale.bandwidth() / 8)
                .attr('x2', xPos + xScale.bandwidth() / 8)
                .attr('y1', yScale(stats.min))
                .attr('y2', yScale(stats.min))
                .attr('stroke', 'black')
                .attr('stroke-width', 1.5);

            // Add jitter points (optional)
            const jitterWidth = xScale.bandwidth() / 2;
            g.selectAll(`.dot-${d.category}`)
                .data(d.values)
                .enter()
                .append('circle')
                .attr('cx', () => xPos + (Math.random() - 0.5) * jitterWidth)
                .attr('cy', value => yScale(value))
                .attr('r', 3)
                .attr('fill', d.color)
                .attr('opacity', 0.6)
                .on('mouseover', (event, value) => {
                    tooltip
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px')
                        .style('display', 'inline-block')
                        .html(`${d.category}: ${value}`);
                })
                .on('mouseout', () => {
                    tooltip.style('display', 'none');
                });
        });

        // Add Legend
        const legend = svg.append('g')
            .attr('transform', `translate(${width + margin.left + 20}, ${margin.top})`);

        boxPlotData.forEach((d, i) => {
            const legendRow = legend.append('g')
                .attr('transform', `translate(0, ${i * 20})`);

            legendRow.append('rect')
                .attr('width', 12)
                .attr('height', 12)
                .attr('fill', d.color)
                .attr('opacity', 0.6);

            legendRow.append('text')
                .attr('x', 18)
                .attr('y', 10)
                .attr('text-anchor', 'start')
                .style('font-size', '12px')
                .text(d.category);
        });

        // Clean up tooltip on unmount
        return () => {
            tooltip.remove();
        };
    };

    // Helper function to get metric labels
    const getMetricLabel = (metric) => {
        const labels = {
            outDegree: '出度',
            inDegree: '入度',
            dataSent: '发送数据量',
            dataReceived: '接收数据量',
            outPortsUsed: '使用的出端口数',
            inPortsUsed: '使用的入端口数',
        };
        return labels[metric] || metric;
    };

    // 处理下拉框变化的函数
    const handleMetricChange = (value) => {
        setSelectedMetric(value);
    };

    const handleTimeSliceChange = (value) => {
        setSelectedTimeSlice(parseInt(value));
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div>
                    <span style={{ marginRight: '8px' }}>展示指标：</span>
                    <Select
                        value={selectedMetric}
                        onChange={handleMetricChange}
                        style={{ width: 150 }}
                    >
                        <Select.Option value="outDegree">出度</Select.Option>
                        <Select.Option value="inDegree">入度</Select.Option>
                        <Select.Option value="dataSent">发送数据量</Select.Option>
                        <Select.Option value="dataReceived">接收数据量</Select.Option>
                        <Select.Option value="outPortsUsed">使用的出端口数</Select.Option>
                        <Select.Option value="inPortsUsed">使用的入端口数</Select.Option>
                    </Select>
                </div>
                <div>
                    <span style={{ marginRight: '8px' }}>时间片：</span>
                    <Select
                        value={selectedTimeSlice}
                        onChange={handleTimeSliceChange}
                        style={{ width: 100 }}
                    >
                        <Select.Option value={1}>时间片1</Select.Option>
                        <Select.Option value={2}>时间片2</Select.Option>
                        <Select.Option value={3}>时间片3</Select.Option>
                    </Select>
                </div>
            </div>
            <svg ref={svgRef}></svg>
        </div>
    );
};

export default BoxPlot;
