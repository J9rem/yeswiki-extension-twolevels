/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import formLoader from './formLoader.service.js'

// manage promise
const initPromisesData = () => {
    return {
        promises: [],
        promisesLabel: []
    }
}

const createPromise = (promisesData,{formId,processFormAsync,getEntriesAsync,getEntriesLabel}) => {
    // get form
    promisesData.promises.push(new Promise((resolve,reject)=>{
        formLoader.load(formId).then((form)=>{
            processFormAsync(form).then(([,formModified,])=>{
                resolve(formModified)
            })
            .catch((e)=>reject(e))
        })
        .catch((e)=>{
            reject(e)
        })
    }))
    promisesData.promisesLabel.push(`getting form ${formId}`)
    // start getting entries in parallel of form
    promisesData.promises.push(
        new Promise((resolve,reject)=>{
            getEntriesAsync().then((entries)=>{
                resolve(entries)
            })
            .catch((e)=>{
                reject(e)
            })
        })
    )
    promisesData.promisesLabel.push(getEntriesLabel)
}

const resolvePromises = async (promisesData) => {
    return await Promise.allSettled(promisesData.promises).then((promisesStatus)=>{
        promisesStatus.forEach((p,idx)=>{
            if (p.status != "fulfilled"){
                console.warn(`error : ${p.reason} (when ${promisesData.promisesLabel[idx]})`)
                console.error({error:p.reason})
            }
        })
        return promisesStatus
    })
}

export default {
    createPromise,
    initPromisesData,
    resolvePromises
}