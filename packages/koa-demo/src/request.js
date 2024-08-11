import url from "node:url";
export const request = {
  get url() {
    return this.req.url;
  },

  get path() {
    let { pathname } = url.parse(this.req.url);

    return pathname;
  },

  get query() {
    let { pathname, query } = url.parse(this.req.url, true);
    return query;
  },
};
