class CustomPromise extends EventTarget {
    constructor(executor) {
        super();

        this.state = 'pending';
        this.result;
        this.fulfillmentHandler;
        this.rejectionHandler;
        this.chainedPromise;
        this.chainedPromiseResolver;

        executor(this.#resolutionFunc, this.#rejectionFunc);
    }

    #resolutionFunc = (fulfillmentValue) => {
        const after = () => {
            if (this.fulfillmentHandler !== undefined) {
                const returnedValue = this.fulfillmentHandler(fv);
                if (returnedValue?.constructor === CustomPromise) {
                    if (returnedValue.state === 'pending') {
                        returnedValue.addEventListener('becameFulfilled', () => {
                            this.chainedPromiseResolver.dispatchEvent(new CustomEvent('fulfilled', { detail: { returnedValue: returnedValue.result } }));
                        });
                        returnedValue.addEventListener('becameRejected', () => {
                            this.chainedPromiseResolver.dispatchEvent(new CustomEvent('rejected', { detail: { returnedValue: returnedValue.result } }));
                        });
                    }
                } else {
                    this.chainedPromiseResolver.dispatchEvent(new CustomEvent('fulfilled', { detail: { returnedValue } }));
                }
            }
            this.result = fv;
            this.state = 'fulfilled';
        }

        let fv;
        switch (fulfillmentValue.constructor) {
            case CustomPromise:
                if (fulfillmentValue.state === 'pending') {
                    fulfillmentValue.addEventListener('becameFulfilled', () => {
                        fv = fulfillmentValue.result;
                        after();
                    });
                    fulfillmentValue.addEventListener('becameRejected', () => {
                        fv = fulfillmentValue.result;
                        after();
                    });
                } else {
                    fv = fulfillmentValue.result;
                    after();
                }
                break;
            case CustomEvent:
                fv = fulfillmentValue.detail.returnedValue;
                after();
                break;
            default:
                fv = fulfillmentValue;
                after();
        }
        this.dispatchEvent(new Event('becameFulfilled'));
    }

    #rejectionFunc = (rejectionReason) => {
        const after = () => {
            if (this.rejectionHandler !== undefined) {
                const returnedValue = this.rejectionHandler(rr);
                if (returnedValue?.constructor === CustomPromise) {
                    if (returnedValue.state === 'pending') {
                        returnedValue.addEventListener('becameFulfilled', () => {
                            this.chainedPromiseResolver.dispatchEvent(new CustomEvent('fulfilled', { detail: { returnedValue: returnedValue.result } }));
                        });
                        returnedValue.addEventListener('becameRejected', () => {
                            this.chainedPromiseResolver.dispatchEvent(new CustomEvent('rejected', { detail: { returnedValue: returnedValue.result } }));
                        });
                    }
                } else {
                    this.chainedPromiseResolver.dispatchEvent(new CustomEvent('rejected', { detail: { returnedValue } }));
                }
            }
            this.result = rr;
            this.state = 'rejected';
        }

        let rr;
        switch (rejectionReason.constructor) {
            case CustomPromise:
                if (rejectionReason.state === 'pending') {
                    rejectionReason.addEventListener('becameFulfilled', () => {
                        rr = rejectionReason.result;
                        after();
                    });
                    rejectionReason.addEventListener('becameRejected', () => {
                        rr = rejectionReason.result;
                        after();
                    });
                } else {
                    rr = rejectionReason.result;
                    after();
                }
                break;
            case CustomEvent:
                rr = rejectionReason.detail.returnedValue;
                after();
                break;
            default:
                rr = rejectionReason;
                after();
        }
        this.dispatchEvent(new Event('becameRejected'));
    }

    then(fulfillmentHandler, rejectionHandler) {
        this.fulfillmentHandler = fulfillmentHandler;
        this.rejectionHandler = rejectionHandler;
        this.chainedPromiseResolver = new EventTarget();
        this.chainedPromise = new CustomPromise((resolve, reject) => {
            this.chainedPromiseResolver.addEventListener('fulfilled', resolve);
            this.chainedPromiseResolver.addEventListener('rejected', reject);
        });

        return this.chainedPromise;
    }

    catch(rejectionHandler) {
        this.rejectionHandler = rejectionHandler;
        this.chainedPromiseResolver = new EventTarget();
        this.chainedPromise = new CustomPromise((resolve, reject) => {
            this.chainedPromiseResolver.addEventListener('fulfilled', resolve);
            this.chainedPromiseResolver.addEventListener('rejected', reject);
        });

        return this.chainedPromise;
    }
}

const myPromise = new CustomPromise((resolve, reject) => {
    window.setTimeout(() => {
        resolve(new CustomPromise((resolve, reject) => {
            window.setTimeout(() => {
                reject('nested');
            }, 1000);
        }));
    }, 1000);
});

myPromise
.then((result) => {
    return result + ' custom promise test';
}, (error) => {
    console.error(error);
})
.then((result) => {
    console.log(result);
});