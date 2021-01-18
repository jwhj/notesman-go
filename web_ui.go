package main

import (
	"archive/tar"
	"compress/gzip"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"syscall"

	"github.com/boltdb/bolt"
	"github.com/gin-gonic/gin"
	"github.com/spf13/afero"
	"github.com/spf13/afero/tarfs"
)

func bundle() {
	cmd := exec.Command("esbuild", "--bundle", "--sourcemap", "src/index.tsx", "--outfile=public/bundle.js", "--define:process.env.NODE_ENV=\"'development'\"")
	cmd.Dir = "ui"
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		panic(err)
	}
	go io.Copy(os.Stdout, stdout)
	stderr, err := cmd.StderrPipe()
	if err != nil {
		panic(err)
	}
	go io.Copy(os.Stderr, stderr)
	cmd.Run()
}
func serve(db *bolt.DB) {
	debug := flag.Bool("d", false, "enable debug mode")
	flag.CommandLine.Parse(os.Args[2:])
	var r *gin.Engine
	if *debug {
		r = gin.Default()
	} else {
		gin.SetMode(gin.ReleaseMode)
		r = gin.Default()
	}
	r.GET("/", func(ctx *gin.Context) {
		ctx.Redirect(http.StatusPermanentRedirect, "/index")
	})
	if *debug {
		r.GET("/index/*filepath", func(ctx *gin.Context) {
			path := ctx.Param("filepath")
			if path == "/bundle.js" {
				bundle()
			}
			ctx.File(filepath.Join("ui/public", path))
		})
	} else {
		appdata, ok := os.LookupEnv("APPDATA")
		var uiDir string
		if ok {
			uiDir = filepath.Join(appdata, "notesman-go")
		} else {
			homeDir, _ := os.UserHomeDir()
			uiDir = filepath.Join(homeDir, "noteman-go")
		}
		// f, err := tarfs.NewFile(filepath.Join(uiDir, "ui.tar.gz"))
		// if err != nil {
		// 	panic(err)
		// }
		// r.GET("/index/*filepath", func(ctx *gin.Context) {
		// 	path := ctx.Param("filepath")
		// 	if path == "/" {
		// 		path = "/index.html"
		// 	}
		// 	err := f.Open(path[1:])
		// 	if err != nil {
		// 		fmt.Println(err)
		// 		if strings.Contains(err.Error(), "file does not exist") {
		// 			ctx.String(http.StatusNotFound, "404")
		// 		}
		// 		return
		// 	}
		// 	io.Copy(ctx.Writer, f)
		// })
		file, err := os.Open(filepath.Join(uiDir, "ui.tar.gz"))
		if err != nil {
			panic(err)
		}
		gzipReader, err := gzip.NewReader(file)
		if err != nil {
			panic(err)
		}
		fs := tarfs.New(tar.NewReader(gzipReader))
		r.StaticFS("/index/", afero.NewHttpFs(fs))
	}
	api := r.Group("/api")
	setupAPI(db, api)
	r.Run("127.0.0.1:8080")
}
func setupAPI(db *bolt.DB, r *gin.RouterGroup) {
	r.GET("/keys", func(ctx *gin.Context) {
		keys := keys(db)
		keysInString := make([]string, len(keys))
		for i, key := range keys {
			keysInString[i] = string(key)
		}
		result, _ := json.Marshal(keysInString)
		ctx.Writer.Write(result)
	})
	var done context.CancelFunc
	cleanupDone := make(chan struct{})
	go func() {
		signals := make(chan os.Signal)
		signal.Notify(signals, syscall.SIGINT)
		<-signals
		log.Println("SIGINT received")
		if done != nil {
			done()
			<-cleanupDone
		}
		os.Exit(0)
	}()
	var selectedKeys []string = []string{}
	r.GET("/selected_keys", func(ctx *gin.Context) {
		buf, err := json.Marshal(selectedKeys)
		if err != nil {
			panic(err)
		}
		ctx.Writer.Write(buf)
	})
	r.POST("/generate", func(ctx *gin.Context) {
		if done != nil {
			done()
			<-cleanupDone
		}
		err := ctx.BindJSON(&selectedKeys)
		if err != nil {
			panic(err)
		}
		fmt.Println(selectedKeys)
		keys := make([][]byte, len(selectedKeys))
		for i, key := range selectedKeys {
			keys[i] = []byte(key)
		}
		ioutil.WriteFile(tmpFile, generate(db, keys), 0600)
		go func() {
			var ctxDone context.Context
			ctxDone, done = context.WithCancel(context.Background())
			watch(db, ctxDone)
			cleanupDone <- struct{}{}
		}()
		ctx.String(http.StatusOK, "ok")
	})
}
