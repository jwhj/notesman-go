import React, { useState, useEffect, useRef, useMemo } from 'react'
import axios from 'axios'
import { renderLive2D } from './live2d'
const {
	message,
	Layout,
	Row, Col,
	Space,
	List,
	Button,
	Divider
} = antd
const {
	PlusOutlined,
	MinusOutlined,
	UpOutlined
} = icons
const { Header, Content, Footer } = Layout
const App = () => {
	const [keysList, setKeysList] = useState<string[]>([])
	const [selected, setSelected] = useState<boolean[]>([])
	const handleShortcutRef = useRef<(e: KeyboardEvent) => void>()
	const reversedKeysList = useMemo(() => {
		const result = keysList.slice()
		return result.reverse()
	}, [keysList])
	const allSelected = useMemo(() => {
		let result = true
		for (const x of selected) result = result && x
		return result
	}, [selected])
	useEffect(() => {
		Promise.all([
			axios.get('/api/keys'),
			axios.get('/api/selected_keys')
		]).then(([result1, result2]) => {
			const tmpList: string[] = result1.data.slice()
			setKeysList(tmpList)
			const selected: boolean[] = Array(tmpList.length).fill(false)
			const selectedKeys: string[] = result2.data
			let i = 0
			for (let j = 0; j < selectedKeys.length; j++) {
				while (i < tmpList.length && tmpList[i] < selectedKeys[j])
					i++
				if (i < tmpList.length && tmpList[i] == selectedKeys[j])
					selected[i] = true
			}
			setSelected(selected)
		})
		const handleShortcut = (e: KeyboardEvent) => {
			handleShortcutRef.current(e)
		}
		addEventListener('keydown', handleShortcut)
		return () => {
			removeEventListener('keydown', handleShortcut)
		}
	}, [])
	handleShortcutRef.current = (e: KeyboardEvent) => {
		switch (e.key) {
			case 'a':
				selectAllOrClear()
				break
			case 'g':
				generate()
				break
		}
	}
	const selectAllOrClear = () => {
		setSelected(Array(selected.length).fill(!allSelected.valueOf()))
	}
	const generate = () => {
		const selectedKeys = keysList.filter((key, i) => selected[i])
		axios.post('/api/generate', selectedKeys).then(res => {
			message.success('我好了')
		})
	}
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
								<Button onClick={selectAllOrClear}>{allSelected.valueOf() ? '清空' : '全选'}</Button>
								<Button onClick={generate}>开始</Button>
							</Space>
							<div>
								<Divider>这是个列表</Divider>
							</div>
							<div style={{
								overflow: 'auto'
							}}>
								<List bordered style={{
									backgroundColor: 'white',
								}} >
									{reversedKeysList.map((item, reversedIndex) => {
										const i = keysList.length - 1 - reversedIndex
										return (
											<List.Item actions={[(
												<Button shape="circle" icon={<UpOutlined />}
													onClick={(e: MouseEvent) => {
														e.stopPropagation()
														for (let j = i; j < selected.length; j++) selected[j] = true
														setSelected(selected.slice())
													}} />
											)]}
												onClick={() => {
													selected[i] = !selected[i]
													setSelected(selected.slice())
												}}>
												<Space>
													<Button type={selected[i] ? "primary" : undefined} shape="circle" icon={selected[i] ? <PlusOutlined /> : <MinusOutlined />}
														style={{
															transition: 'all 0.3s ease'
														}}
														onMouseDown={(e: FocusEvent) => e.preventDefault()} />
													{item}
												</Space>
											</List.Item>
										)
									})}
								</List>
							</div>
						</Col>
					</Row>
				</Content>
				<Footer>
					随便写几个字，反正不能空着
				</Footer>
			</Layout>
		</React.Fragment>
	)
}
ReactDOM.render(
	<App />,
	document.querySelector('#app')
)
renderLive2D()