export const copyText = (address) => {
    const addressTextArea = document.createElement("input");

    document.body.appendChild(addressTextArea);

    addressTextArea.setAttribute("id", "addressTextArea_id");

    document.getElementById("addressTextArea_id").value = address;


    addressTextArea.select();

    document.execCommand("copy");

    document.body.removeChild(addressTextArea);

    alert("Item Copied To Clip Board");
    
};