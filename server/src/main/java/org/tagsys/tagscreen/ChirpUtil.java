package org.tagsys.tagscreen;

import java.io.FileWriter;
import java.util.Arrays;

import org.apache.commons.lang.ArrayUtils;
import org.apache.commons.math3.complex.Complex;
import org.apache.commons.math3.transform.DftNormalization;
import org.apache.commons.math3.transform.FastFourierTransformer;
import org.apache.commons.math3.transform.TransformType;

public class ChirpUtil {
	
	public static final int Fs = 44100;
	public static final int F1 = 18000;
	public static final int F2 = 20000;
	
	public static final double PREAMBLE_DURATION = 0.09;
	public static final double SYMBOLE_DURATION = 0.02;
	
	public static FastFourierTransformer fft;
	
	public static double[] PREAMBLE;			
	public static double[] SYMBOLE_0;
	public static double[] SYMBOLE_1;
	
	static{
		
		fft =  new FastFourierTransformer(DftNormalization.STANDARD);
		
		PREAMBLE = chirp(F1,F2, Fs, PREAMBLE_DURATION);
	
		SYMBOLE_0 = chirp(F1,F2, Fs, SYMBOLE_DURATION);
		
		SYMBOLE_1 = chirp(F2,F1, Fs, SYMBOLE_DURATION);
		
	}
	

	
	
	
	public static double[] chirp(int f1, int f2, int fs, double duration){
		
		double k = (f2-f1)/duration;
		
		double ts = 1.0/fs;
		int length = (int)Math.ceil(duration*fs);
		double[] result = new double[length];
		for(int i=0;i<length;i++){
			double t = i*ts;
			double angle = 2*Math.PI*f1*t + Math.PI*k*t*t;
			result[i]=Math.cos(angle);
		}
		
		return result;
	}
	
	
	public static Correlation seekPreamable(double[] signal){
		
		MathUtil.normalize(signal);
	
		signal = MathUtil.pad(signal);
		Complex[] transformedSignal = fft.transform(signal, TransformType.FORWARD);
		double[] preamble = MathUtil.pad(PREAMBLE, signal.length);
		Complex[] transformedPreamble = fft.transform(preamble, TransformType.FORWARD);
		Complex[] conjTransFormedPreamble = MathUtil.conj(transformedPreamble);
		Complex[] multiply = MathUtil.multiply(transformedSignal, conjTransFormedPreamble);
		Complex[] xcor = fft.transform(multiply, TransformType.INVERSE);
		
		return new Correlation(xcor);
	}
	
	public static void main(String[] args) throws Exception{
		
	
		for(int i=0;i<ChirpUtil.SYMBOLE_1.length;i++){
			if(i%8==0){
				System.out.println();
			}
			System.out.print(SYMBOLE_1[i]+",");
		}
	
		
		
//		long start = System.nanoTime();
//		
//		double[] prefix = new double[100000];
//		for(int i=0;i<prefix.length;i++){
//			prefix[i] = Math.random();
//		}
//				
//		double[] signal = ArrayUtils.addAll(prefix, PREAMBLE);
//		
//		Correlation cor = seekPreamable(signal);
//		
//		long end = System.nanoTime();
//			
//		System.out.println(cor.getIndex());
//		System.out.println(cor.getMax());
//		
//		System.out.println(end-start);
		
		
		
	}
	
}
