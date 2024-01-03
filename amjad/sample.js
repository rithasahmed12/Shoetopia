let couponName = document.getElementById('couponName').value;
  let couponCode = document.getElementById('couponCode').value;
  let couponDescription = document.getElementById('couponDescription').value;
  let couponAvailability = document.getElementById('couponAvailability').value;
  let couponDiscountAmount = document.getElementById('couponDiscountAmount').value;
  let minAmount = document.getElementById('minAmount').value;

const nameRegex = /^[a-zA-Z\s]+$/;
const codeRegex = /^[a-zA-Z]+$/;
const descriptionRegex = /^[a-zA-Z0-9\s.,;:'"()?!]+$/m;
const numericRegex = /^[0-9]+$/;


  if (!nameRegex.test(couponName)) {
    document.getElementById('nameError').innerHTML = 'Name should only contain alphabets';
    return false;
  } else {
    document.getElementById('nameError').innerHTML = '';
  }

  if (!codeRegex.test(couponCode)) {
    document.getElementById('codeError').innerHTML = 'Coupon code must consist of only letters and should not include spaces.';
    return false;
  } else {
    document.getElementById('codeError').innerHTML = '';
  }

  if (!descriptionRegex.test(couponDescription)) {
    document.getElementById('descriptionError').innerHTML = 'Description should only contain alphabets';
    return false;
  } else {
    document.getElementById('descriptionError').innerHTML = '';
  }

  if (!numericRegex.test(couponAvailability) || parseFloat(couponAvailability) <= 0) {
    document.getElementById('availabilityError').innerHTML = 'Availability should be a positive numeric value';
    return false;
  } else {
    document.getElementById('availabilityError').innerHTML = '';
  }

  if (!numericRegex.test(couponDiscountAmount) || parseInt(couponDiscountAmount) < 0) {
    document.getElementById('discountError').innerHTML = 'Discount amount should be a non-negative integer';
    return false;
  } else {
    document.getElementById('discountError').innerHTML = '';
  }
  if (!numericRegex.test(minAmount) || parseInt(minAmount) < 0) {
    document.getElementById('minError').innerHTML = 'Minimum amount should be a non-negative integer';
    return false;
  } else {
    document.getElementById('minError').innerHTML = '';
  }



  function validateForm(){

   
       


    // Perform validation checks here
             const offerName = document.getElementById('offerName').value;
             const startingDate = new Date(document.getElementById('startingDate').value);
             const expiryDate = new Date(document.getElementById('expiryDate').value);
             const percentage = parseInt(document.getElementById('percentage').value, 10);

      const nameRegex = /^[a-zA-Z\s]+$/; // Allow only letters and spaces
             if (!nameRegex.test(offerName)) {
            
               document.getElementById('errorContainer').style.display = 'block';
               document.getElementById('errorContainer').textContent = 'Offer Name should only contain letters and spaces.';
                  return false;
             }

             if (expiryDate < startingDate) {
             
               document.getElementById('errorContainer').style.display = 'block';
               document.getElementById('errorContainer').textContent = 'Expiry Date cannot be earlier than Starting Date.';
                   return false;
             }

             if (percentage < 1 || percentage > 100) {
      
               document.getElementById('errorContainer').style.display = 'block';
               document.getElementById('errorContainer').textContent = 'Percentage should be between 1 and 100.';
                return false;
             }

           
           // Validation checks
            return true

           }



 // Get the "Starting Date" input element
 const startingDateInput = document.getElementById('startingDate');

 // Set the minimum attribute to the current date in the "YYYY-MM-DD" format
 const currentDate = new Date().toISOString().split('T')[0];
 startingDateInput.setAttribute('min', currentDate);

 // Get the "Expiry Date" input element
 const expiryDateInput = document.getElementById('expiryDate');

 // Set the minimum attribute for "Expiry Date" to the current date
 expiryDateInput.setAttribute('min', currentDate);

