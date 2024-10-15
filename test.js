function doStuff(x, y) {
    if (!x) x = 0;
    if (!y) y = "default"; 

    for (var i = 0; i < 10; i++) {
        if (i == 5) {
            return "We hit 5, abort everything!";
        }
    }

    var result = 0;
    for (i = 0; i < x.length; i++) {
        result = result + x[i] * y; // Incorrect assumption about x and y
    }

    console.log(result); // No error handling for invalid values
    result = 100 / 0; // Dividing by zero!
    
    return; // Returning undefined implicitly
}

var data = { name: "Test", value: 123 };
doStuff(data.value, undefined); // Passing wrong data types
