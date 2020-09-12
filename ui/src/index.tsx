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
const App = () => {
	const [keysList, setKeysList] = useState<string[]>([])
	const [selected, setSelected] = useState<boolean[]>([])
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
L2Dwidget.init({
	model: {
		jsonPath: "https://cdn.jsdelivr.net/npm/live2d-widget-model-shizuku@1.0.5/assets/shizuku.model.json",
		scale: 1
	},
	// "display": {
	// 	"position": "right",
	// 	"width": 150,
	// 	"height": 300,
	// 	"hOffset": 0,
	// 	"vOffset": -20
	// },
	// "mobile": {
	// 	"show": true,
	// 	"scale": 0.5
	// },
	// "react": {
	// 	"opacityDefault": 0.7,
	// 	"opacityOnHover": 0.2
	// },
	dialog: {
		enable: true,
		script: {
			"every idle 1s": ''
		}
	}
})
const titleTextList = [
	'看什么看，记笔记',
	'你跟上进度了？',
	'嗯？又开始颓了？'
]
setTimeout(() => {
	const el: HTMLElement = document.querySelector('.live2d-widget-dialog')
	el.style.display = 'none'
	const el1 = document.createElement('div')
	el1.className = 'live2d-widget-dialog'
	el1.style.opacity = '1'
	el1.innerHTML = `<span id="title"></span>`
	el.parentElement.appendChild(el1)
	let prevIndex = -1
	let typedRef: Typed
	const changeTitleText = () => {
		let i: number
		do {
			i = Math.floor(Math.random() * titleTextList.length)
		} while (i === prevIndex)
		if (typedRef) typedRef.destroy()
		prevIndex = i
		typedRef = new Typed('#title', {
			strings: [titleTextList[i]],
			typeSpeed: 30
		})
	}
	changeTitleText()
	setInterval(changeTitleText, 60000)
}, 500)