/**
 * @file 下滑刷新 - 组件二次封装
 */
import React, { PureComponent } from 'react';
import ReactDOM from 'react-dom';
import { ListView, PullToRefresh } from 'antd-mobile';
import promiseRequest from '../../utils/promise_request'

const NUM_ROWS = 50;
let pageIndex = 0;

class ListViewScroll extends PureComponent {
  constructor(props) {
    super(props);
    const dataSource = new ListView.DataSource({
      rowHasChanged: (row1, row2) => row1 !== row2,
    });
    this.state = {
      data: [],
      dataSource,
      refreshing: true,
      isLoading: true,
      height: document.documentElement.clientHeight,
      queryParams:this.props.queryParams
    };
    this.onRefresh = this.onRefresh.bind(this);
    this.onEndReached = this.onEndReached.bind(this);
  }
  async genData (pIndex = 0) {
    const dataArr = [];
    const promiseData = await promiseRequest(`${this.props.url}`, {
      body: {
        pagesize: NUM_ROWS,
        page: pIndex + 1,
        ...this.state.queryParams
      },
      type:'formData',
      method:this.props.method || 'POST'
    });

    const data = promiseData.data ||promiseData.result.rows || promiseData.result ;
    for (let i = 0; i < data.length ; i++) {
      dataArr.push(`row - ${(pIndex * NUM_ROWS) + i}`);
    }
    this.setState({ data: [ ...this.state.data, ...data] });
    return dataArr;
    
  }
  componentDidUpdate() {
    document.body.style.overflow = 'hidden';
  }
  async componentDidMount() {
    const hei = document.documentElement.clientHeight - ReactDOM.findDOMNode(this.lv).parentNode.offsetTop;
    this.rData = await this.genData();
    this.setState({
      dataSource: this.state.dataSource.cloneWithRows(this.rData),
      height: hei,
      refreshing: false,
      isLoading: false,
    })
  }
//  static getDerivedStateFromProps (nextProps) {
//    //console.log(this.props.queryParams,'queryParams');
//    console.log(nextProps,'nextProps');
//    this.setState({ queryParams : nextProps.queryParams})
//     // if (this.props.queryParams !== nextProps.queryParams) {

//     // }
//   }

// now
UNSAFE_componentWillReceiveProps =(nextProps) =>{
  // console.log(nextProps,'nextProps')
  // console.log(this,'this')
  //this.setState({queryParams : nextProps.queryParams})
  //const hei = document.documentElement.clientHeight - ReactDOM.findDOMNode(this.lv).parentNode.offsetTop;
  // this.rData =  this.genData();
  // this.setState({
  //   dataSource: this.state.dataSource.cloneWithRows(this.rData),
  //   height: hei,
  //   refreshing: false,
  //   isLoading: false,
  // })
}

// static getDerivedStateFromProps(nextProps, prevState) {
//   if (nextProps.queryParams !== prevState.queryParams) {
  
//   }
//   return null
// }

  async onRefresh () {
    this.setState({ refreshing: true, isLoading: true });
    this.rData = await this.genData();
    this.setState({
      dataSource: this.state.dataSource.cloneWithRows(this.rData),
      refreshing: false,
      isLoading: false,
    })
  };
  
  async onEndReached (event) {
    if (this.state.isLoading && !this.state.hasMore) {
      return;
    }
    console.log('reach end', event);
    this.setState({ isLoading: true });
    const newData = await this.genData(++pageIndex);
    this.rData = [...this.rData, ...newData];
    this.setState({
      dataSource: this.state.dataSource.cloneWithRows(this.rData),
      isLoading: false,
    });
  };

  render() {
    const { data } = this.state;
    let index = data.length - 1;
    const row = (rowData, sectionID, rowID) => {
      if (index < 0) {
        index = data.length - 1;
      } 
      const obj = data[index--];
      obj.index = Number(rowID) + 1;
      return (
        <this.props.item {...obj}/>
      );
    };
    const separator = (sectionID, rowID) => (
      <div
        key={`${sectionID}-${rowID}`}
        style={{
          backgroundColor: '#F5F5F9',
          // height: 8,
          height: 1,
          // borderTop: '1px solid #ECECED',
          borderBottom: '1px solid #ECECED',
        }}
      /> 
    );
    return (
      <ListView
        key={'1'}
        ref={el => this.lv = el}
        dataSource={this.state.dataSource}
        renderFooter={() => (<div style={{ padding: 30, textAlign: 'center' }}>
          {this.state.isLoading ? '加载中...' : '加载完成'}
        </div>)}
        renderRow={row}
        style={{
          minHeight: 'calc(100vh - 5px)',
          overflowX: 'hidden'
        }}
        renderSeparator={this.props.separator ? separator: null }
        pullToRefresh={<PullToRefresh
          refreshing={this.state.refreshing}
          onRefresh={this.onRefresh}
        />}
        scrollRenderAheadDistance={500}
        onEndReached={this.onEndReached}
        onEndReachedThreshold={10}
        pageSize={4}
      />
    );
  }
}

export default ListViewScroll;
