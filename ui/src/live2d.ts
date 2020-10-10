import Typed from 'typed.js'
export const renderLive2D = () => {
	L2Dwidget.init({
		model: {
			jsonPath: "https://cdn.jsdelivr.net/npm/live2d-widget-model-shizuku@1.0.5/assets/shizuku.model.json",
			scale: 1
		},
		display: {
			vOffset: -95
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
		'嗯？又开始颓了？',
		'你不会听不懂课准备跑路了吧？'
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
}