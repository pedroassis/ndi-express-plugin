'package nd-express-plugin';

'import nd-express-plugin.ParamBuilder';
'import nd.FunctionRunner';
function ExpressBinder(ParamBuilder, FunctionRunner) {
    
    this.bind = function(ExpressApp, method, url, callback) {
        ExpressApp[method](url, function(req, res, next) {
            var locals = ParamBuilder.build(req, res, next);
            var hadException;

            var returnedValue = runCallback(callback, locals, function(error) {
                hadException = true;
                errorHandler(res, error);
            });

            if(isPromise(returnedValue)){
                bindPromise(returnedValue, res);
            }
            else if(!hadException && returnedValue !== undefined){
                res.send(returnedValue);
            }
        });
    };

    

    function bindPromise (promise, response) {
        promise.then(response.send.bind(response), errorHandler.bind(this, response));
    }

    function isPromise(obj) {
        return obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function' && obj.then.length >= 2 && obj.then.length <= 3;
    }

    /**
     *  Try outside main function to avoid compiler bailout
     */
    function runCallback(callback, locals, errorHandler) {
        try {
            return FunctionRunner.run(callback, locals);
        } catch (e){
            errorHandler(e);
        }
    }

    /**
     *  Error handler, future versions should provide exception handling feature
     */
    function errorHandler (response, error) {
        var message = error && error.stack || error.message || error;
        response.status(400).send(message || 'Bad Request');
    }
}
module.exports = ExpressBinder;