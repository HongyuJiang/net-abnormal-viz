import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { generateTimeSeriesData } from './dualtimeline.jsx';

const AreaChart = () => {
    const svgRef = useRef();
    const data = generateTimeSeriesData();

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        const width = 1200; // 保持宽度
        const height = 400; // 保持高度
        const margin = { top: 20, right: 200, bottom: 50, left: 100 }; // 增加左边距
    
        svg.selectAll('*').remove(); // 清除之前的内容
    
        // 检查数据是否有效
        if (!data || data.length === 0) {
            console.error("Data is undefined or empty.");
            return;
        }
    
        // 设置x轴比例
        const x = d3.scaleLinear()
            .domain(d3.extent(data, d => d.time))
            .range([margin.left, width - margin.right]);
    
        // 使用ColorBrewer的配色方案
        const color = d3.scaleOrdinal()
            .domain(['sendTraffic', 'receiveTraffic', 'sendConnections', 'receiveConnections', 'anomalyNodes'])
            .range(d3.schemeSet2); // 更专业的颜色
    
        const metrics = [
            { key: 'sendTraffic', label: '发送数据量', unit: 'MB' },
            { key: 'receiveTraffic', label: '接收数据量', unit: 'MB' },
            { key: 'sendConnections', label: '发送连接数', unit: 'connections' },
            { key: 'receiveConnections', label: '接收连接数', unit: 'connections' },
            { key: 'anomalyNodes', label: '异常节点数量', unit: 'nodes' }
        ];
    
        // 定义子图之间的间距
        const spacing = 20;
    
        // 计算每个子图的高度，考虑间距
        const areaChartHeight = (height - margin.top - margin.bottom - (metrics.length - 1) * spacing) / metrics.length;
    
        // 添加图例
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width - margin.right + 20}, ${margin.top})`);
    
        // 使用多列布局，如果图例项太多，可以分成多列
        const legendItemHeight = 20;
        const legendColumnWidth = 150; // 每列的宽度
        const itemsPerColumn = 10
    
        metrics.forEach((metric, i) => {
            const column = Math.floor(i / itemsPerColumn);
            const row = i % itemsPerColumn;
    
            const legendRow = legend.append('g')
                .attr('transform', `translate(${column * legendColumnWidth}, ${row * legendItemHeight})`);
    
            legendRow.append('rect')
                .attr('width', 15)
                .attr('height', 15)
                .attr('fill', color(metric.key));
    
            legendRow.append('text')
                .attr('x', 20)
                .attr('y', 12)
                .attr('text-anchor', 'start')
                .attr('font-size', '12px')
                .text(metric.label);
        });
    
        // 添加网格线函数
        const makeXGridlines = () => d3.axisBottom(x).ticks(10);
        const makeYGridlines = (y) => d3.axisLeft(y).ticks(5);
    
        // 为每个指标创建区域图
        metrics.forEach((metric, index) => {
            const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => d[metric.key])])
                .range([areaChartHeight, 0])
                .nice();
    
            const area = d3.area()
                .x(d => x(d.time))
                .y0(y(0))
                .y1(d => y(d[metric.key]))
                .curve(d3.curveMonotoneX); // 使用更平滑的曲线
    
            // 计算每个子图的垂直偏移量，考虑间距
            const yOffset = margin.top + index * (areaChartHeight + spacing);
    
            // 添加网格线
            svg.append('g')
                .attr('class', 'grid')
                .attr('transform', `translate(0, ${yOffset})`)
                .call(makeYGridlines(y)
                    .tickSize(-(width - margin.left - margin.right))
                    .tickFormat(''))
                .attr('stroke-opacity', 0.1);
    
            // 添加区域路径
            svg.append('path')
                .datum(data)
                .attr('fill', color(metric.key))
                .attr('d', area)
                .attr('transform', `translate(0, ${yOffset})`)
                .attr('opacity', 0.7)
                .on('mouseover', function(event, d) {
                    d3.select(this).attr('opacity', 1);
                    tooltip.style('display', null);
                })
                .on('mousemove', function(event, d) {
                    const [mouseX, mouseY] = d3.pointer(event);
                    const xm = x.invert(mouseX - margin.left);
                    const bisect = d3.bisector(d => d.time).left;
                    const idx = bisect(data, xm);
                    const selectedData = data[idx];
                    tooltip
                        .attr('transform', `translate(${x(selectedData.time)}, ${y(selectedData[metric.key]) + yOffset})`)
                        .select('text')
                        .text(`${metric.label}: ${selectedData[metric.key]} ${metric.unit}`);
                })
                .on('mouseout', function() {
                    d3.select(this).attr('opacity', 0.7);
                    tooltip.style('display', 'none');
                });
    
            // 添加y轴
            svg.append('g')
                .attr('transform', `translate(${margin.left - 10}, ${yOffset})`) // 保持左边距一致
                .call(d3.axisLeft(y).ticks(5))
                .attr('font-size', '10px')
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-0.5em") // 向左移动标签，避免与图形重叠
                .attr("dy", "0.35em");
        });
    
        // 添加x轴
        svg.append('g')
            .attr('transform', `translate(0, ${margin.top + metrics.length * areaChartHeight + (metrics.length - 1) * spacing})`)
            .call(d3.axisBottom(x).ticks(10))
            .attr('font-size', '12px');
    
        // 添加x轴标签
        svg.append('text')
            .attr('x', (width - margin.right) / 2)
            .attr('y', height - 10)
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .text('时间');
    
        // 添加网格线
        svg.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(0, ${margin.top + metrics.length * areaChartHeight + (metrics.length - 1) * spacing})`)
            .call(makeXGridlines()
                .tickSize(-(height - margin.top - margin.bottom))
                .tickFormat(''))
            .attr('stroke-opacity', 0.1);
    
        // 添加工具提示
        const tooltip = svg.append('g')
            .attr('class', 'tooltip')
            .style('display', 'none');
    
        tooltip.append('circle')
            .attr('r', 4)
            .attr('fill', 'black');
    
        tooltip.append('text')
            .attr('x', 8)
            .attr('dy', '0.35em')
            .attr('font-size', '12px')
            .attr('fill', 'black');
    
        // 创建刷选工具（可选）
        const brush = d3.brushX()
            .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
            .on('brush end', brushed);
    
        svg.append('g')
            .attr('class', 'brush')
            .call(brush);
    
        function brushed(event) {
            const selection = event.selection;
            if (selection) {
                // 可以在此添加筛选逻辑
                svg.selectAll('.brush .selection')
                    .attr('fill', 'lightblue')
                    .attr('opacity', 0.3);
            }
        }
    
    }, [data]);
    

    return <svg ref={svgRef} width={1200} height={400}></svg>;
};

export default AreaChart;
