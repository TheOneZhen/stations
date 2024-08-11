import http from "node:http";
import EventEmitter from "node:events";
import { context } from "./context";
import { request } from "./request";
import { response } from "./response";

export class Application extends EventEmitter {
  constructor() {
    super();
    this.context = Object.create(context);
    this.request = Object.create(request);
    this.response = Object.create(response);
    this.middlewares = [];
  }
  createContext(req, res) {
    // req, res 是原生的  request 和 response 是我们自己扩展
    const ctx = Object.create(this.context);
    const request = Object.create(this.request);
    const response = Object.create(this.response);
    ctx.request = request;
    ctx.request.req = ctx.req = req;

    ctx.response = response;
    ctx.response.res = ctx.res = res;

    return ctx;
  }
  handleRequest = (req, res) => {
    const ctx = this.createContext(req, res);
    res.statusCode = 404;
    this.compose(ctx)
      .then(() => {
        const body = ctx.body;
        if (body) res.end(body);
        else res.end("Not Found");
      })
      .catch((e) => {
        this.emit("error", e);
      });
  };
  listen() {
    const server = http.createServer(this.handleRequest);
    server.listen(...arguments);
  }
  use(middleware) {
    this.middlewares.push(middleware);
  }
  compose(ctx){
    let index = -1 // 上一次中间件的索引
    const dispatch = (i) => {
      if(i <= index){ // 如果当前索引小于上一次索引，代表重复调用
        return Promise.reject(new Error('next() called multiple times'))
      }
      index = i
      if(this.middlewares.length === i) return Promise.resolve() // 最后一次调用，不需要调用next
      let middleware = this.middlewares[i]
      try{
        return Promise.resolve(middleware(ctx, () => dispatch(i+1))) //这里的() => dispatch(i+1) 代表我们的next函数也就是下一次中间件的执行
      }catch(e){
        return Promise.reject(e)
      }
    }
    return dispatch(0)
  }
  
}
