//组间通信
export default class Bus{
    constructor(){
        this.$cache = {}
    }
    add(pageModel){
        let pagePath = this._getPageModelPath(pageModel);
        this.$cache[pagePath] = pageModel;
    }
    get(pagePath){
        return this.$cache[pagePath]
    }
    delete(pageModel){
        try{
            delete this.$cache[this._getPageModelPath(pageModel)];
        }catch(e){

        }
    }
    _getPageModelPath(page){
        return page.__route__;
    }
}