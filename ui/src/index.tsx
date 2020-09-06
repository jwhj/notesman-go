import React, { useState, useEffect, useRef, useMemo } from 'react'
import axios from 'axios'
import Typed from 'typed.js'
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
	DownOutlined
} = icons
const { Header, Content, Footer } = Layout
const titleTextList = [
	'看什么看，记笔记',
	'你跟上进度了？',
	'嗯？又开始颓了？'
]
const App = () => {
	const [keysList, setKeysList] = useState<string[]>([])
	const [selected, setSelected] = useState<boolean[]>([])
	const prevIndex = useRef(-1)
	const typedRef = useRef<Typed>()
	const handleShortcutRef = useRef<(e: KeyboardEvent) => void>()
	const allSelected = useMemo(() => {
		let result = true
		for (const x of selected) result = result && x
		return result
	}, [selected])
	useEffect(() => {
		axios.get('/api/keys').then(result => {
			setKeysList(result.data.slice())
			setSelected(Array(result.data.length).fill(false))
			console.log(result)
		})
		const handleShortcut = (e: KeyboardEvent) => {
			handleShortcutRef.current(e)
		}
		addEventListener('keydown', handleShortcut)
		const changeTitleText = () => {
			let i: number
			do {
				i = Math.floor(Math.random() * titleTextList.length)
			} while (i === prevIndex.current)
			if (typedRef.current) typedRef.current.destroy()
			prevIndex.current = i
			typedRef.current = new Typed('#title', {
				strings: [titleTextList[i]],
				typeSpeed: 30
			})
		}
		changeTitleText()
		const id = setInterval(changeTitleText, 5000)
		return () => {
			removeEventListener('keydown', handleShortcut)
			clearInterval(id)
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
						<span id="title"></span>
					</h1>
				</Header>
				<Content style={{ padding: 10 }}>
					<Row>
						<Col span={8} offset={8}>
							<Space>
								<Button onClick={selectAllOrClear}>{allSelected.valueOf() ? '清空' : '全选'}</Button>
								<Button onClick={generate}>开始</Button>
							</Space>
							<Divider>这是个列表</Divider>
							<div style={{
								overflow: 'auto'
							}}>
								<List bordered style={{
									backgroundColor: 'white',
								}} >
									{keysList.map((item, i) => (
										<List.Item actions={[(
											<Button shape="circle" icon={<DownOutlined />}
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
									))}
								</List>
							</div>
						</Col>
					</Row>
				</Content>
				<Footer>
					UI是随便搞的
				</Footer>
			</Layout>
		</React.Fragment>
	)
}
ReactDOM.render(
	<App />,
	document.querySelector('#app')
)