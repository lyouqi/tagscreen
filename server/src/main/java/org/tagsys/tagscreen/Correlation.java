package org.tagsys.tagscreen;

import org.apache.commons.math3.complex.Complex;

public class Correlation {
	
	private int index = -1;
	private double max = Double.MIN_VALUE;
	private Complex[] result = null;
	
	public int getIndex() {
		return index;
	}
	public void setIndex(int index) {
		this.index = index;
	}
	public double getMax() {
		return max;
	}
	public void setMax(double max) {
		this.max = max;
	}
	public Complex[] getResult() {
		return result;
	}
	public void setResult(Complex[] result) {
		this.result = result;
	}
	
	public Correlation(){
		
	}
	
	public Correlation(Complex[] result){
		for(int i=0;i<result.length;i++){
			if(result[i].getReal()>this.max){
				this.max = result[i].getReal();
				this.index = i;
			}
		}
		this.result = result;
	}
	
	@Override
	public String toString(){
		return index+":"+max;
	}
	
}
