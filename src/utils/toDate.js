const toDate = (timestamp) => timestamp ? new Date(timestamp * 1000) : null;

export default toDate