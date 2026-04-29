package com.indtrans.freight.util;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class AmountInWords {
    
    private static final String[] ones = {
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen"
    };
    
    private static final String[] tens = {
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    };
    
    public String convert(BigDecimal amount) {
        // Round to 2 decimal places
        amount = amount.setScale(2, RoundingMode.HALF_UP);
        
        long rupees = amount.longValue();
        int paise = amount.remainder(BigDecimal.ONE)
                .multiply(BigDecimal.valueOf(100))
                .intValue();
        
        StringBuilder result = new StringBuilder();
        
        if (rupees == 0) {
            result.append("Zero");
        } else {
            convertNumber(rupees, result);
        }
        
        result.append(" Rupees");
        
        if (paise > 0) {
            result.append(" and ");
            convertNumber(paise, new StringBuilder()).append(" Paise");
        }
        
        result.append(" Only");
        return result.toString().trim();
    }
    
    private StringBuilder convertNumber(long number, StringBuilder result) {
        if (number >= 10000000) {
            result.append(convertNumber(number / 10000000, new StringBuilder()))
                  .append(" Crore ");
            number %= 10000000;
        }
        if (number >= 100000) {
            result.append(convertNumber(number / 100000, new StringBuilder()))
                  .append(" Lakh ");
            number %= 100000;
        }
        if (number >= 1000) {
            result.append(convertNumber(number / 1000, new StringBuilder()))
                  .append(" Thousand ");
            number %= 1000;
        }
        if (number >= 100) {
            result.append(ones[(int)(number / 100)]).append(" Hundred ");
            number %= 100;
        }
        if (number >= 20) {
            result.append(tens[(int)(number / 10)]).append(" ");
            number %= 10;
        }
        if (number > 0) {
            result.append(ones[(int)number]).append(" ");
        }
        return result;
    }
}