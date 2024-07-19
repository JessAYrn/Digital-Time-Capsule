export const copyText = (address) => {
    const addressTextArea = document.createElement("input");

    document.body.appendChild(addressTextArea);

    addressTextArea.setAttribute("id", "addressTextArea_id");
    addressTextArea.setAttribute("value", address);

    const copyText = document.getElementById("addressTextArea_id");

    addressTextArea.select();

    navigator.clipboard.writeText(copyText.value);

    document.body.removeChild(addressTextArea);

    alert("Item Copied To Clip Board");
    
};