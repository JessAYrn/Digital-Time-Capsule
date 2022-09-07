import { deviceType } from "../../Utils";


export const visibilityFunctionLoginPage = (props) => {

    const {
        entry, 
        divs, 
        title,
        containerIndex
    } = props;

    if(entry.isIntersecting){
        divs.forEach(div => div.classList.add("animate"));
        if(containerIndex === 0) {
            title.innerHTML = "Scroll for More Info"
            title.classList.add("animate");
        } else if (containerIndex === 1){
            title.classList.remove("animate");
        } else if (containerIndex === 2){
            title.innerHTML = "Features"
            title.classList.add("animate");
        } else if(containerIndex === 5){
            if(deviceType() === "mobile"){
                title.innerHTML = "The Tech Behind the App"
                title.classList.add("animate");
            } else {
                title.classList.remove("animate");
            }
        } else if(containerIndex === 6) {
            title.innerHTML = "The Tech Behind the App"
            title.classList.add("animate");
        }
    }  else if(!entry.isIntersecting){
        divs.forEach(div => div.classList.remove("animate"));
        if(containerIndex === 3 && deviceType() === "mobile"){
            title.classList.remove("animate");
        } else if(containerIndex === 6) {
            title.classList.remove("animate");

        }
    }
}

export const visibilityFunctionDefault = (props) => {

    const {
        entry, 
        divs, 
        containerIndex
    } = props;

    if(entry.isIntersecting){
        divs.forEach(div => div.classList.add("animate"));
    }  else {
        divs.forEach(div => div.classList.remove("animate"));
    }
}


export const getIntObserverFunc = (props) => {
    const {
        containerIndex,
        className,
        visibilityFunction
    } = props;
    let queryClassName = "." + className;
    if(containerIndex !== undefined) queryClassName += `._${containerIndex}`;
    return (entries) => {
        entries.forEach(entry => {
            const divs = document.querySelectorAll(queryClassName);
            const title = document.getElementById('title');
            visibilityFunction({entry: entry, divs: divs, title: title, containerIndex: containerIndex});
        });
    };
};