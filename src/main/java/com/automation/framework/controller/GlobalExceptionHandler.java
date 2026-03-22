package com.automation.framework.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<String> handleIllegalArgument(IllegalArgumentException ex) {
		String message = ex.getMessage() != null ? ex.getMessage() : "";
		if (message.contains("not found")) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(message);
		}
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(message);
	}
}
