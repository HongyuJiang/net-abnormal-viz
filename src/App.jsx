import './App.css';
import React, { useState } from 'react';
import { Layout, InputNumber, Slider, Select, Button, Statistic } from 'antd';
import NetworkGraph from './network.jsx';
import StatPlot, { generateMockData } from './stat.jsx';
import ByteChart from './bytes.jsx';
import MatrixVisualization from './mat.jsx';
import BoxPlot from './boxplot.jsx';
import { ChromePicker } from 'react-color';

const { Sider, Content } = Layout;
const { Option } = Select;

const App = () => {
  const [edgeWidth, setEdgeWidth] = useState(1);
  const [edgeColor, setEdgeColor] = useState('#000000');
  const [nodeRadiusOption, setNodeRadiusOption] = useState(5);
  const [nodeColor, setNodeColor] = useState('#ff0000');
  const [nodeRepulsion, setNodeRepulsion] = useState(100);
  const [edgeAttraction, setEdgeAttraction] = useState(50);
  const [isEdgeColorPickerVisible, setEdgeColorPickerVisible] = useState(false);
  const [isNodeColorPickerVisible, setNodeColorPickerVisible] = useState(false);

  // State for statistics
  const [nodeCount] = useState(Math.floor(Math.random() * 500));
  const [connectionCount] = useState(Math.floor(Math.random() * 1000000));

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Sider width={280} style={{ background: '#ffffff', borderRight: '1px solid #d9d9d9' }}>
        <div style={{ padding: '24px' }}>
          <h2 style={{ marginBottom: '24px', color: '#1890ff' }}>配置面板</h2>

          <div style={{ marginBottom: '16px' }}>
            <p>边宽：</p>
            <InputNumber
              min={1}
              max={10}
              value={edgeWidth}
              onChange={(value) => setEdgeWidth(value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p>边色：</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                onClick={() => setEdgeColorPickerVisible(!isEdgeColorPickerVisible)}
                style={{
                  width: '100px',
                  height: '20px',
                  backgroundColor: edgeColor,
                  border: '1px solid #d9d9d9',
                  cursor: 'pointer',
                }}
              />
              {isEdgeColorPickerVisible && (
                <div style={{ position: 'absolute', zIndex: 2 }}>
                  <ChromePicker
                    color={edgeColor}
                    onChangeComplete={(color) => setEdgeColor(color.hex)}
                  />
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p>节点半径：</p>
            <InputNumber
              min={1}
              max={20}
              value={nodeRadiusOption}
              onChange={(value) => setNodeRadiusOption(value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p>节点颜色：</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                onClick={() => setNodeColorPickerVisible(!isNodeColorPickerVisible)}
                style={{
                  width: '100px',
                  height: '20px',
                  backgroundColor: nodeColor,
                  border: '1px solid #d9d9d9',
                  cursor: 'pointer',
                }}
              />
              {isNodeColorPickerVisible && (
                <div style={{ position: 'absolute', zIndex: 2 }}>
                  <ChromePicker
                    color={nodeColor}
                    onChangeComplete={(color) => setNodeColor(color.hex)}
                  />
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p>节点排斥力：</p>
            <Slider
              min={50}
              max={500}
              value={nodeRepulsion}
              onChange={(value) => setNodeRepulsion(value)}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p>边的吸引力：</p>
            <Slider
              min={10}
              max={100}
              value={edgeAttraction}
              onChange={(value) => setEdgeAttraction(value)}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p>选择模式：</p>
            <Select value="探索模式" style={{ width: '100%' }}>
              <Option value="框选模式">框选模式</Option>
              <Option value="探索模式">探索模式</Option>
            </Select>
          </div>

          <div style={{ marginTop: '24px' }}>
            <Button type="primary" style={{ width: '100%' }}>
              上传文件
            </Button>
          </div>
        </div>

        <div style={{ padding: '24px', borderTop: '1px solid #d9d9d9' }}>
          <h3 style={{ marginBottom: '16px', color: '#1890ff' }}>数据统计信息</h3>
          <Statistic title="节点数量" value={nodeCount} style={{ marginBottom: '16px' }} />
          <Statistic title="连接数量" value={connectionCount} />
        </div>
      </Sider>

      <Content style={{ padding: '24px', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: 3, border: '1px solid #d9d9d9', padding: '16px', borderRadius: '8px', height: '700px' }}>
            <h2 style={{ color: '#1890ff' }}>网络连接图</h2>
            <div id="network-connection-graph" style={{ width: '100%', height: '100%' }}>
              <NetworkGraph node_num={300} edgeWidth={edgeWidth} edgeColor={edgeColor} nodeRadius={nodeRadiusOption} nodeColor={nodeColor} />
            </div>
          </div>
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ flex: 1, border: '1px solid #d9d9d9', padding: '16px', borderRadius: '8px' }}>
              <h3 style={{ color: '#1890ff' }}>全节点雷达图</h3>
              <StatPlot data={generateMockData(100, 2)} />
            </div>
            <div style={{ flex: 1, border: '1px solid #d9d9d9', padding: '16px', borderRadius: '8px' }}>
              <h3 style={{ color: '#1890ff' }}>全节点分组特征箱图</h3>
              <BoxPlot />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ flex: 2, border: '1px solid #d9d9d9', padding: '16px', borderRadius: '8px' }}>
            <h3 style={{ color: '#1890ff' }}>网络时序特征</h3>
            <ByteChart />
          </div>
          <div style={{ flex: 1, border: '1px solid #d9d9d9', padding: '16px', borderRadius: '8px' }}>
            <h3 style={{ color: '#1890ff' }}>关注节点的连接情况</h3>
            <MatrixVisualization />
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default App;
