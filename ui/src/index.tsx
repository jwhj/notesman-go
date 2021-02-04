import React, { useState, useEffect, useRef, useMemo } from 'react'
import ReactDOM from 'react-dom'
import { makeObservable, observable, computed, action } from 'mobx'
import { observer } from 'mobx-react-lite'
import axios from 'axios'
import { renderLive2D } from './live2d'
import {
	message,
	Layout,
	Row, Col,
	Space,
	List,
	Button,
	Divider
} from 'antd'
import {
	PlusOutlined,
	MinusOutlined,
	UpOutlined
} from '@ant-design/icons'
const { Header, Content, Footer } = Layout
class KeysStore {
	@observable keysList: string[] = []
	@observable selected: Map<string, boolean> = new Map()
	constructor() {
		// makeObservable(this, {
		// 	keysList: observable,
		// 	selected: observable,
		// 	allSelected: computed,
		// 	generate: action.bound,
		// 	selectAllOrClear: action.bound,
		// 	handleShortcut: action.bound
		// })
		makeObservable(this)
	}
	@computed get allSelected() {
		let result = true
		for (const key of this.keysList)
			result = result && this.selected.get(key)
		return result
	}
	selectAllOrClear = action(() => {
		const target = !this.allSelected
		for (const key of this.keysList)
			this.selected.set(key, target)
	})
	generate = () => {
		const selectedKeys = this.keysList.filter(key => this.selected.get(key))
		axios.post('/api/generate', selectedKeys).then(() => {
			message.success('我好了')
		})
	}
	handleShortcut = (e: KeyboardEvent) => {
		switch (e.key) {
			case 'a':
				this.selectAllOrClear()
				break
			case 'g':
				this.generate()
				break
		}
	}
}
const keysStore = new KeysStore()

const KeysView = observer(() => {
	return (
		<List bordered style={{
			backgroundColor: 'white',
			// maxHeight: '100%',
			overflow: 'auto'
		}} >
			{keysStore.keysList.slice().reverse().map((item, reversedIndex) => {
				const i = keysStore.keysList.length - 1 - reversedIndex
				const key = keysStore.keysList[i]
				const selected = keysStore.selected.get(key)
				return (
					<List.Item key={key} actions={[(
						<Button shape="circle" icon={<UpOutlined />}
							onClick={action(e => {
								e.stopPropagation()
								// for (let j = i; j < selected.length; j++) selected[j] = true
								// setSelected(selected.slice())
								for (let j = i; j < keysStore.keysList.length; j++)
									keysStore.selected.set(keysStore.keysList[j], true)
							})} />
					)]}
						onClick={action(() => {
							keysStore.selected.set(key, !selected)
						})}>
						<Space>
							<Button type={selected ? "primary" : undefined} shape="circle"
								icon={selected ? <PlusOutlined /> : <MinusOutlined />}
								style={{
									transition: 'all 0.3s ease'
								}}
								onMouseDown={e => e.preventDefault()} />
							{item}
						</Space>
					</List.Item>
				)
			})}
		</List>
	)
})

const App = observer(() => {
	useEffect(() => {
		Promise.all([
			axios.get('/api/keys'),
			axios.get('/api/selected_keys')
		]).then(action(([result1, result2]) => {
			keysStore.keysList = result1.data
			const selected: string[] = result2.data
			for (const key of selected)
				keysStore.selected.set(key, true)
		}))
		addEventListener('keydown', keysStore.handleShortcut)
	}, [])
	return (
		<React.Fragment>
			<Layout style={{ height: '100%' }}>
				<Header>
					<h1 style={{ color: 'white' }}>
						用心写代码，用脚做UI
					</h1>
				</Header>
				<Content style={{ padding: 10 }}>
					<Row style={{ height: '100%' }}>
						<Col span={8} offset={8} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
							<Space>
								<Button onClick={keysStore.selectAllOrClear}>{keysStore.allSelected ? '清空' : '全选'}</Button>
								<Button onClick={keysStore.generate}>开始</Button>
							</Space>
							<div>
								<Divider>这是个列表</Divider>
							</div>
							{/* <div style={{
								overflow: 'hidden'
							}}> */}
							<KeysView />
							{/* </div> */}
						</Col>
					</Row>
				</Content>
				<Footer>
					随便写几个字，反正不能空着
				</Footer>
			</Layout>
		</React.Fragment >
	)
})
ReactDOM.render(
	<App />,
	document.querySelector('#app')
)
renderLive2D()