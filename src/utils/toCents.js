function toCents(price) {
    // convert string/float to integer cents
    return Math.round(parseFloat(price) * 100);
}


export default toCents;